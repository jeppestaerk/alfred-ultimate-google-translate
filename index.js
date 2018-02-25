'use strict';
const alfy = require('alfy');
const translate = require('google-translate-api');

const query = alfy.input;
const langFrom = alfy.cache.get('langFrom') || 'auto';
const langTo = alfy.cache.get('langTo') || 'en';
const voice = process.env['voice'];

const output = [];
const promises = [];

if (query.split(" ")[0] === 'SWAP') {
	alfy.cache.set('langFrom', langTo);
	alfy.cache.set('langTo', langFrom);
	output.push({
		title: 'from/to languages swapped, press ⏎ to reload',
		arg: '',
		variables: {
			action: 'rerun'
		}
	})
} else if (!query.split(" ")[0]) {
	output.push({
		title: 'Type your query or press ⏎ for settings',
		subtitle: `Current settings: translate from ${langFrom} to ${langTo}`,
		arg: 'SETTINGS',
		variables: {
			action: 'rerun'
		}
	});
	if (langFrom !== 'auto') {
		output.push({
			title: 'Swap from/to languages',
			arg: 'SWAP',
			variables: {
				action: 'rerun'
			}
		})
	}
} else if (query.split(" ")[0] === 'SETTINGS' && query.split(" ")[3] === 'SET') {
	if (query.split(" ")[1] === 'FROM') {
		alfy.cache.set('langFrom', query.split(" ")[2]);
		output.push({
			title: `From language updated to: ${query.split(" ")[2]}`,
			subtitle: 'Press ⏎ to reload',
			arg: '',
			variables: {
				action: 'rerun'
			}
		})
	} else if (query.split(" ")[1] === 'TO') {
		alfy.cache.set('langTo', query.split(" ")[2]);
		output.push({
			title: `To language updated to: ${query.split(" ")[2]}`,
			subtitle: 'Press ⏎ to reload',
			arg: '',
			variables: {
				action: 'rerun'
			}
		})
	}
} else if (query.split(" ")[0] === 'SETTINGS') {
	if (!query.split(" ")[1]) {
		output.push({
			title: 'Set from language',
			subtitle: `Current: ${langFrom}`,
			arg: 'SETTINGS FROM ',
			variables: {
				action: 'rerun'
			}
		});
		output.push({
			title: 'Set to language',
			subtitle: `Current: ${langTo}`,
			arg: 'SETTINGS TO ',
			variables: {
				action: 'rerun'
			}
		})
	} else if (query.split(" ")[1] === 'FROM') {
		Object.keys(translate.languages).filter(lang => lang.includes(query.split(" ")[2])).forEach(lang => {
			output.push({
				title: `${translate.languages[lang]} (${lang})`,
				arg: `SETTINGS FROM ${lang} SET`,
				variables: {
					action: 'rerun'
				}
			})
		})
	} else if (query.split(" ")[1] === 'TO') {
		Object.keys(translate.languages).filter(lang => lang.includes(query.split(" ")[2])).forEach(lang => {
			output.push({
				title: `${translate.languages[lang]} (${lang})`,
				arg: `SETTINGS TO ${lang} SET`,
				variables: {
					action: 'rerun'
				}
			})
		})
	}
} else {
	promises.push(translate(alfy.input, {raw: true, from: langFrom, to: langTo}).then(data => {
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
							variables: {
								action: 'copy'
							},
							mods: {
								cmd: {
									subtitle: `Pronounce: ${text}`,
									arg: `-v ${voice} ${text}`,
									variables: {
										action: 'pronounce'
									}
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
								variables: {
									action: 'copy'
								},
								mods: {
									cmd: {
										subtitle: `Pronounce: ${text}`,
										arg: `-v ${voice} ${text}`,
										variables: {
											action: 'pronounce'
										}
									}
								}
							});
						}

					});
				});
			}
			if (rawObj[11]) {
				rawObj[11].forEach(r => {
					r[1][0].forEach(x => {
						const text = x[0];
						const match = x[1] / 10;
						if (text !== query && text) {
							if (text.length > 1) {
								output.push({
									title: `or try with: [${text}]?`,
									arg: text,
									variables: {
										action: 'rerun'
									}
								});
							}
						}
					});
				});
			}
		} else {
			const corrected = data.from.text.value.replace(/\[/, '').replace(/\]/, '');
			output.push({
				title: `did you mean: ${data.from.text.value}?`,
				arg: corrected,
				variables: {
					action: 'rerun'
				}
			});
		}
		if (!output.length) {
			output.push({
				title: '...not found'
			})
		}
	}));
}

Promise.all(promises).then(() => alfy.output(output));
