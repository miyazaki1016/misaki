#!/usr/bin/env python3
"""Read-only resume candidates from the canonical ledger; never change Issue state."""
import argparse
import json
import re
from pathlib import Path
from development_history_evidence import clean

MARKER = re.compile(r'<!-- work-resume:v1\s*(.*?)\s*-->', re.S)
STAGES = ('implementation', 'verification', 'main', 'production', 'device')


def checkpoints(text):
    blocks = MARKER.findall(text)
    if len(blocks) != 1:
        raise ValueError('Expected one work-resume:v1 block in canonical ledger')
    rows = json.loads(blocks[0])['checkpoints']
    if not isinstance(rows, list):
        raise ValueError('Invalid checkpoints')
    seen = set()
    for row in rows:
        number = row.get('issue')
        if type(number) is not int or number < 1 or number in seen:
            raise ValueError('Invalid or duplicate Issue')
        seen.add(number)
        if row.get('status') not in ('active', 'paused', 'review', 'complete'):
            raise ValueError('Invalid status')
        for key in ('goal', 'next', 'updated', 'completion'):
            if not isinstance(row.get(key), str) or not row[key].strip():
                raise ValueError('Missing checkpoint field: ' + key)
        children = row.get('blocked_by', [])
        if not isinstance(children, list) or any(type(n) is not int or n < 1 or n == number for n in children):
            raise ValueError('Invalid blocking Issue')
        if row['status'] == 'paused' and not row.get('pause_reason'):
            raise ValueError('Paused checkpoint needs a reason')
        for stage, value in row.get('stages', {}).items():
            if stage not in STAGES or value.get('status') not in ('unconfirmed', 'passed', 'not_applicable'):
                raise ValueError('Invalid stage')
            if value['status'] != 'unconfirmed' and not value.get('evidence'):
                raise ValueError('Stage assertion needs evidence')
        if row['status'] == 'complete' and any(row.get('stages', {}).get(s, {}).get('status') not in ('passed', 'not_applicable') for s in STAGES):
            raise ValueError('Complete checkpoint has unconfirmed stages')
    # Do not accept cycles between tracked checkpoints.
    graph = {r['issue']: r.get('blocked_by', []) for r in rows}
    def walk(n, path):
        if n in path:
            raise ValueError('Cyclic checkpoint dependency')
        for child in graph.get(n, []):
            walk(child, path | {n})
    for n in graph:
        walk(n, set())
    return rows


def build(rows, lookup):
    result = []
    for row in rows:
        children = []
        for number in row.get('blocked_by', []):
            try:
                issue = lookup(number)
                # Closing as not_planned is not evidence that a blocking fix finished.
                done = (issue.get('number') == number and not issue.get('pull_request')
                        and issue.get('state') == 'closed' and issue.get('state_reason') == 'completed')
                state = 'completed' if done else 'open' if issue.get('state') == 'open' else 'unconfirmed'
            except Exception:
                state = 'unconfirmed'
            children.append({'issue': number, 'state': state})
        status = row['status']
        candidate = ('要確認' if any(c['state'] == 'unconfirmed' for c in children)
                     else '子案件対応中' if any(c['state'] == 'open' for c in children)
                     else '再開候補' if status == 'paused' and children
                     else '保留・復帰条件を確認' if status == 'paused'
                     else '完了記録（証拠を再確認）' if status == 'complete'
                     else '継続候補')
        result.append({**row, 'candidate': candidate, 'children': children, 'auto_applied': False})
    return result


def render(rows, repository, generated_at):
    safe = lambda x: clean(str(x)).replace('|', '&#124;').replace('\n', ' ')
    lines = ['# 中断した目的と再開候補', '', '取得時刻：' + safe(generated_at), '',
             '開発台帳のチェックポイントから生成。子Issueの完了は復帰条件の候補であり、親の完成・着手許可・本番反映ではない。', '',
             '| 親案件・目的 | 状態 | 中断理由／子案件 | 次の一手 |', '| --- | --- | --- | --- |']
    for row in rows:
        url = f"https://github.com/{repository}/issues/{row['issue']}"
        children = ', '.join(f"[#{c['issue']}](https://github.com/{repository}/issues/{c['issue']})：{c['state']}" for c in row['children'])
        lines.append(f"| [#{row['issue']}]({url}) {safe(row['goal'])} | {safe(row['candidate'])} | {safe(row.get('pause_reason', ''))} {children} | {safe(row['next'])} |")
    lines += ['', '状態の自動変更・コメント投稿・マージ・デプロイ・通知送信なし。再開前の既存成果照合と元の許可条件を守る。', '']
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--ledger', default='docs/DEVELOPMENT_LEDGER.md')
    parser.add_argument('--report', default='inventory-output/report.json')
    parser.add_argument('--output', default='inventory-output')
    parser.add_argument('--live', action='store_true')
    args = parser.parse_args()
    report = json.loads(Path(args.report).read_text())
    repository = report['repository']
    if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository):
        raise ValueError('Invalid repository')
    rows = checkpoints(Path(args.ledger).read_text())
    if args.live:
        # Reuse the existing read-only API transport; credentials never enter the report.
        from development_inventory import get
        lookup = lambda n: get(f'/repos/{repository}/issues/{n}')
    else:
        def lookup(n):
            value = report['snapshot']['issues'][str(n)]
            return {'number': n, **value}
    result = build(rows, lookup)
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    (output / 'resume-candidates.json').write_text(clean(json.dumps({'repository': repository, 'generated_at': report['generated_at'], 'candidates': result, 'auto_applied': False}, ensure_ascii=False, indent=2)) + '\n')
    text = render(result, repository, report['generated_at'])
    (output / 'resume-candidates.md').write_text(text)
    print(text)


if __name__ == '__main__':
    main()
