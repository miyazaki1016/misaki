import json
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from development_resume import checkpoints, build, render


def row(**extra):
    return dict(issue=102, goal='エンジン総点検', status='paused', pause_reason='修正待ち',
                blocked_by=[181], next='元のコード比較に戻る', updated='2026-11-11',
                completion='全候補の所在と未確認条件を記録', **extra)


class ResumeTests(unittest.TestCase):
    def test_completed_child_only_proposes_resume(self):
        source = row()
        result = build([source], lambda n: dict(number=n, state='closed', state_reason='completed'))
        self.assertEqual(result[0]['candidate'], '再開候補')
        self.assertEqual(result[0]['status'], 'paused')
        self.assertFalse(result[0]['auto_applied'])
        self.assertNotIn('children', source)

    def test_open_missing_failed_and_not_planned_never_resume(self):
        for issue in [dict(number=181, state='open'), {}, dict(number=181, state='closed', state_reason='not_planned'), dict(number=182, state='closed', state_reason='completed')]:
            self.assertNotEqual(build([row()], lambda n: issue)[0]['candidate'], '再開候補')
        def fail(n):
            raise OSError('unavailable')
        self.assertEqual(build([row()], fail)[0]['candidate'], '要確認')

    def test_all_children_must_complete(self):
        r = row(); r['blocked_by'] = [181, 182]
        self.assertEqual(build([r], lambda n: dict(number=n, state='closed' if n == 181 else 'open', state_reason='completed'))[0]['candidate'], '子案件対応中')

    def test_invalid_and_unproven_completion_rejected(self):
        for changes in [dict(status='complete'), dict(blocked_by=[102]), dict(issue='102'), dict(pause_reason=''), dict(stages={'production': {'status':'passed'}})]:
            r = row(); r.update(changes)
            with self.assertRaises(ValueError):
                checkpoints('<!-- work-resume:v1\n'+json.dumps({'checkpoints':[r]})+'\n-->')

    def test_cycles_rejected(self):
        a = row(); b = row(); b['issue']=181; b['blocked_by']=[102]
        with self.assertRaises(ValueError):
            checkpoints('<!-- work-resume:v1\n'+json.dumps({'checkpoints':[a,b]})+'\n-->')

    def test_markdown_and_secret_redaction(self):
        r = row(); r['goal'] = 'x|y\n' + 'ghp_' + 'a'*36
        text = render(build([r], lambda n: {}), 'owner/repo', 'now')
        self.assertIn('&#124;', text)
        self.assertNotIn('ghp_'+'a'*36, text)
        self.assertIn('/issues/102', text)

    def test_real_ledger_parses(self):
        data = checkpoints((Path(__file__).resolve().parents[1]/'docs/DEVELOPMENT_LEDGER.md').read_text())
        self.assertEqual(data[0]['issue'], 102)


if __name__ == '__main__':
    unittest.main()
