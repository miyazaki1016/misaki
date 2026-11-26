import assert from "node:assert/strict";
import test from "node:test";
import {BlindQualitySafeError,decodeBlindQualityReply} from "../lib/context-ab-blind-quality.ts";

test("blind quality decoder returns only the reply string",()=>{
  assert.equal(decodeBlindQualityReply({candidates:[{content:{parts:[{text:'{"reply":"こんにちは"}'}]}}]}),"こんにちは");
});

test("empty or blocked model response is categorized without including content",()=>{
  assert.throws(()=>decodeBlindQualityReply({candidates:[{content:{parts:[]}}]}),(error:unknown)=>{
    assert.ok(error instanceof BlindQualitySafeError);
    assert.equal(error.code,"gemini-empty-response");
    assert.equal(error.message,"gemini-empty-response");
    return true;
  });
});

test("malformed JSON is categorized without leaking model output",()=>{
  assert.throws(()=>decodeBlindQualityReply({candidates:[{content:{parts:[{text:"private response text"}]}}]}),(error:unknown)=>{
    assert.ok(error instanceof BlindQualitySafeError);
    assert.equal(error.code,"gemini-invalid-json");
    assert.equal(error.message,"gemini-invalid-json");
    assert.equal(error.message.includes("private response"),false);
    return true;
  });
});

test("missing or blank reply property is categorized safely",()=>{
  for(const raw of ['{"other":"x"}','{"reply":"  "}']){
    assert.throws(()=>decodeBlindQualityReply({candidates:[{content:{parts:[{text:raw}]}}]}),(error:unknown)=>{
      assert.ok(error instanceof BlindQualitySafeError);
      assert.equal(error.code,"gemini-missing-reply");
      return true;
    });
  }
});
