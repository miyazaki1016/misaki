'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const AXES = ['friendship', 'trust', 'playfulness', 'affection', 'romance'];

/**
 * Contract-only projection for synthetic fixtures.
 * This is not imported by the application and does not claim to test the
 * current production route, DB, authentication, or any external service.
 */
function projectRelationshipMaterial({ ownerId, characterId, fiveAxis, points, emotionAction }) {
  const scoped = Boolean(
    ownerId && characterId && fiveAxis &&
    fiveAxis.ownerId === ownerId && fiveAxis.characterId === characterId
  );

  const relationship = scoped
    ? {
        characterId,
        axes: Object.fromEntries(AXES.map((axis) => [axis, fiveAxis.axes[axis]])),
        status: fiveAxis.status,
      }
    : null;

  return {
    relationship,
    pointCandidates: Array.isArray(points?.candidateInput) ? [...points.candidateInput] : [],
    progressMeter: Number.isFinite(points?.progressMeter) ? points.progressMeter : null,
    expression: emotionAction
      ? { emotion: emotionAction.emotion ?? null, action: emotionAction.action ?? null }
      : null,
  };
}

const canonical = Object.freeze({
  ownerId: 'synthetic-owner-a',
  characterId: 'synthetic-misaki',
  axes: Object.freeze({ friendship: 42, trust: 51, playfulness: 23, affection: 37, romance: 8 }),
  status: 'none',
});

test('5-axis v1.1 alone supplies canonical relationship axes and status', () => {
  const result = projectRelationshipMaterial({
    ownerId: canonical.ownerId,
    characterId: canonical.characterId,
    fiveAxis: canonical,
    points: { candidateInput: [{ signal: 'care' }], progressMeter: 80, legacyStage: 4, status: 'romantic_partner' },
    emotionAction: { emotion: 'happy', action: 'NORMAL', status: 'romantic_partner' },
  });

  assert.deepEqual(result.relationship, {
    characterId: 'synthetic-misaki',
    axes: { friendship: 42, trust: 51, playfulness: 23, affection: 37, romance: 8 },
    status: 'none',
  });
  assert.equal('intimacyStage' in result.relationship, false);
});

test('points remain candidate input and a display meter, not a stage or status source', () => {
  const result = projectRelationshipMaterial({
    ownerId: canonical.ownerId,
    characterId: canonical.characterId,
    fiveAxis: canonical,
    points: { candidateInput: [{ signal: 'warmth' }], progressMeter: 100, legacyStage: 5, status: 'romantic_partner' },
  });

  assert.deepEqual(result.pointCandidates, [{ signal: 'warmth' }]);
  assert.equal(result.progressMeter, 100);
  assert.equal(result.relationship.status, 'none');
  assert.equal('intimacyStage' in result.relationship, false);
});

test('emotion/action v2 remains per-turn expression and cannot rewrite canonical state', () => {
  const before = structuredClone(canonical);
  const result = projectRelationshipMaterial({
    ownerId: canonical.ownerId,
    characterId: canonical.characterId,
    fiveAxis: canonical,
    emotionAction: { emotion: 'hurt', action: 'PULL', relationshipStatus: 'romantic_partner' },
  });

  assert.deepEqual(result.expression, { emotion: 'hurt', action: 'PULL' });
  assert.equal(result.relationship.status, 'none');
  assert.deepEqual(canonical, before);
});

test('missing canonical 5-axis state fails closed instead of falling back to points or emotion', () => {
  const result = projectRelationshipMaterial({
    ownerId: canonical.ownerId,
    characterId: canonical.characterId,
    fiveAxis: null,
    points: { candidateInput: [{ signal: 'affection' }], progressMeter: 100 },
    emotionAction: { emotion: 'affectionate', action: 'NORMAL' },
  });

  assert.equal(result.relationship, null);
  assert.deepEqual(result.pointCandidates, [{ signal: 'affection' }]);
  assert.deepEqual(result.expression, { emotion: 'affectionate', action: 'NORMAL' });
});

test('owner or character mismatch fails closed even when the same synthetic IDs exist', () => {
  const wrongOwner = projectRelationshipMaterial({
    ownerId: 'synthetic-owner-b',
    characterId: canonical.characterId,
    fiveAxis: canonical,
    points: { progressMeter: 100 },
  });
  const wrongCharacter = projectRelationshipMaterial({
    ownerId: canonical.ownerId,
    characterId: 'synthetic-other-character',
    fiveAxis: canonical,
    points: { progressMeter: 100 },
  });

  assert.equal(wrongOwner.relationship, null);
  assert.equal(wrongCharacter.relationship, null);
});

test('high romance score and points do not create partner or marriage status', () => {
  const highScores = {
    ...canonical,
    axes: { friendship: 95, trust: 95, playfulness: 80, affection: 95, romance: 100 },
    status: 'none',
  };
  const result = projectRelationshipMaterial({
    ownerId: highScores.ownerId,
    characterId: highScores.characterId,
    fiveAxis: highScores,
    points: { candidateInput: [], progressMeter: 100 },
    emotionAction: { emotion: 'affectionate', action: 'NORMAL' },
  });

  assert.equal(result.relationship.status, 'none');
  assert.equal('marriage' in result.relationship, false);
});
