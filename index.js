'use strict';
const alfy = require('alfy');
const translate = require('google-translate-api');

const query = alfy.input;
const langTo = process.env.ugtLangTo;
const langFrom = process.env.ugtLangFrom;
const voice = process.env.ugtVoice;
const pronounce = process.env.ugtPronounce;
const didYouMean = process.env.ugtDidYouMean;
const notFound = process.env.ugtNotFound;

const output = [];

translate(query, {raw: true, from: langFrom, to: langTo}).then(data => {

	if (!data.from.text.didYouMean) {
		const rawObj = JSON.parse(data.raw);
		if (rawObj[1]) {
			rawObj[1].forEach(r => {
				const partOfSpeech = r[0];
				r[2].forEach(x => {
					const text = x[0];
					const relation = x[1];
					output.push({
						title: text,
						subtitle: `(${partOfSpeech}) ${relation.join(', ')}`,
						arg: text,
						mods: {
							cmd: {
								subtitle: `${pronounce} \"${text}\"`,
								arg: `-v ${voice} ${text}`
							}
						}
					});
				});
			});
		}
		if (rawObj[5]) {
			rawObj[5].forEach(r => {
				r[2].forEach(x => {
					const text = x[0];
					const match = x[1] / 10;
						if (text !== query) {
							output.push({
								title: text,
								subtitle: `(synonym) ${match}% match`,
								arg: text,
								mods: {
									cmd: {
										subtitle: `${pronounce} \"${text}\"`,
										arg: `-v ${voice} ${text}`
									}
								}
							});
						}

				});
			});
		}

	} else {
		const corrected = data.from.text.value.replace(/\[/, '').replace(/\]/, '');
		output.push({
			title: `${didYouMean}: ${data.from.text.value}?`,
			autocomplete: `${corrected}`
		});
	}

	if (!output.length) {
		output.push({
			title: notFound,
			autocomplete: ''
		})
	}
	alfy.output(output);
});
