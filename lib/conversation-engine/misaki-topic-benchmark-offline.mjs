// Synthetic benchmark cases for Japanese conversation continuity.
// Gold labels are authored expectations, NOT real-world ground truth.
export const topicCases=[
 {id:'hakone-cancel',history:['来週、箱根の紅葉を見に行こうかな','羽田の便は今日はどうかな'],message:'やっぱり今回は見送るよ',goldTopic:0,ambiguous:true},
 {id:'airport-delay',history:['箱根の紅葉を見たい','羽田の便が遅れているらしい'],message:'その遅れ、もう解消した？',goldTopic:1,ambiguous:false},
 {id:'hotel-checkout',history:['潮見プリンスのチェックアウトを調べよう','箱根の旅館を探したい'],message:'さっきのホテル、何時までだっけ？',goldTopic:0,ambiguous:true},
 {id:'rain-alert',history:['雨の通知が何度も来る','旅行は来週にした'],message:'まだ何回も届く？',goldTopic:0,ambiguous:false},
 {id:'work-shift',history:['明日はタクシーの勤務日','箱根旅行を検討している'],message:'明日の仕事、どうしようかな',goldTopic:0,ambiguous:false},
 {id:'pronoun-unclear',history:['箱根の旅行を検討','羽田での待機を検討'],message:'やっぱりあれはやめた',goldTopic:null,ambiguous:true},
 {id:'quote-not-own',history:['友達が旅行を予約した','自分は旅行を検討中'],message:'友達はやめたらしい',goldTopic:0,ambiguous:false},
 {id:'weather-followup',history:['江東区の天気予報を確認','空港の遅延を確認'],message:'雨はいつやむの？',goldTopic:0,ambiguous:false},
 {id:'mixed-reference',history:['ホテルのチェックアウトを調べる','飛行機の出発時刻を調べる'],message:'時間、変わった？',goldTopic:null,ambiguous:true},
 {id:'negated-cancel',history:['箱根旅行を予約した','洗車屋に行く予定'],message:'旅行は中止しないよ',goldTopic:0,ambiguous:false},
 {id:'station-delay',history:['電車の運行状況が心配','羽田空港の天気が心配'],message:'電車は動いてる？',goldTopic:0,ambiguous:false},
 {id:'revisit-promise',history:['今度、写真を見せると約束した','天気の話をした'],message:'約束した写真、覚えてる？',goldTopic:0,ambiguous:false},
];
