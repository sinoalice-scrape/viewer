"use strict";

const nf = new Intl.NumberFormat('en-US');

let db = {
	json: new Map(),
	index: {
		shinma_skills: null,
		characters: null,
	}
};

function datamineJsonUrl(path) {
	return `https://raw.githubusercontent.com/sinoalice-datamine/data/master/${path}.json`;
}

const en_ultimate_art_method_mst_list = datamineJsonUrl("EN/ultimate_art_method_mst_list");
const en_character_mst_list = datamineJsonUrl("EN/character_mst_list");

const weapon_map_short = [
	'',
	'I', 'T', 'A', 'S',
	'B', 'H', 'P', 'P',
];

const weapon_map_long = [
	'',
	'Instrument', 'Tome', 'Artifact', 'Staff',
	'Blade', 'Heavy', 'Projectile', 'Polearm',
];

function viewGuildHistory(historyUrl) {
	function generateShinmaCells(shinma, shinma_skills) {
		if (!shinma) {
			return '<td align="center"></td><td align="center"></td>';
		}

		const shinma_mst = shinma_skills.get(shinma.art_mst_id);
		const shinma_weapons =
			weapon_map_short[shinma_mst.element1] +
			weapon_map_short[shinma_mst.element2] +
			weapon_map_short[shinma_mst.element3] +
			weapon_map_short[shinma_mst.element4];

		return `<td align="center">${shinma_weapons}</td>` +
			`<td align="center">${shinma.guild_a_count}/${shinma.guild_b_count}</td>`;
	}

	const match_history = db.json.get(historyUrl);
	const shinma_skills = db.index.shinma_skills;

	let guild_a_name = match_history.items[0].guild_a_name;

	let html = `<h1>${guild_a_name}</h1>`;
	html += '<table class="table table-striped table-bordered table-sm"><thead><tr>';
	html += '<th>Date</th>';
	html += '<th>Rank</th>';
	html += '<th>Result</th>';
	html += '<th>Enemy Guild</th>';
	html += '<th>Guild ID</th>';
	html += `<th>${guild_a_name} (Lifeforce)</th>`;
	html += '<th>Enemy Guild (Lifeforce)</th>';
	html += `<th>${guild_a_name} (Combo)</th>`;
	html += '<th>Enemy Guild (Combo)</th>';
	html += `<th>${guild_a_name} (Ship)</th>`;
	html += '<th>Enemy Guild (Ship)</th>';
	html += '<th>1st Shinma</th>';
	html += '<th>Tally</th>';
	html += '<th>2nd Shinma</th>';
	html += '<th>Tally</th>';
	html += '</tr></thead>';
	html += '<tbody>';

	let match_count = match_history.items.length;
	for (let i = match_count-1; i >= 0; i--) {
		let m = match_history.items[i];
		let dt = new Date(m.start_time * 1000);

		let result = "Tie";
		if (m.guild_a_points > m.guild_b_points)
			result = "Victory";
		else if (m.guild_a_points < m.guild_b_points)
			result = "Defeat";

		const match_url = `?view=match&time=${m.start_time}&a=${m.guild_a_id}&b=${m.guild_b_id}`;

		html += '<tr>';
		html += `<td><a href="${match_url}">${dt.getUTCFullYear()}/${dt.getUTCMonth()+1}/${dt.getUTCDate()}</a></td>`;
		html += `<td>${m.rank}</td>`;
		html += `<td>${result}</td>`;
		html += `<td>${m.guild_b_name}</td>`;
		html += `<td align="right">${m.guild_b_id}</td>`;
		html += `<td align="right">${nf.format(m.guild_a_points)}</td>`;
		html += `<td align="right">${nf.format(m.guild_b_points)}</td>`;
		html += `<td align="right">${m.guild_a_combo}</td>`;
		html += `<td align="right">${m.guild_b_combo}</td>`;
		html += `<td align="right">${m.guild_a_ship_win}</td>`;
		html += `<td align="right">${m.guild_b_ship_win}</td>`;
		html += generateShinmaCells(m.shinma[0], shinma_skills);
		html += generateShinmaCells(m.shinma[1], shinma_skills);
		html += '</tr>';
	}
	html += '</tbody></table>';

	let content = document.getElementById("content");
	content.innerHTML = html;
}

function viewMatch(dt, matchUrl) {
	function generateShinmaCells(shinma, shinma_skills) {
		if (!shinma) {
			return '<tr><th scope="row"></th><td></td><td></td></tr>';
		}

		const shinma_mst = shinma_skills.get(shinma.artMstId);
		const shinma_weapons =
			weapon_map_short[shinma_mst.element1] +
			weapon_map_short[shinma_mst.element2] +
			weapon_map_short[shinma_mst.element3] +
			weapon_map_short[shinma_mst.element4];

		return `<tr><th scope="row">${shinma_weapons}</th>` +
			`<td>${shinma.guildACount}</td>` +
			`<td>${shinma.guildBCount}</td></tr>`;
	}

	function generateMemberList(guild, members, characters) {
		let html = '<table class="table table-striped table-bordered table-sm text-nowrap"><thead>';
		html += `<tr><th>${guild}</th><th>Weapon</th><th>Stats</th><th>HP</th><th>Class</th></tr>`;
		html += '</thead><tbody>';
		for (let i = 0; i < members.length; i++) {
			const m = members[i];
			const char = characters.get(m.characterMstId);
			html += '<tr>';
			html += `<td>${m.name}</td>`;
			html += `<td>${weapon_map_long[char.favoriteWeapon]}</td>`;
			html += `<td>${nf.format(m.totalPower)}</td>`;
			html += `<td>${nf.format(m.maxHp)}</td>`;
			html += `<td>${char.name}</td>`;
			html += '</tr>';
		}
		html += '</tbody></table>';
		return html;
	}

	const match = db.json.get(matchUrl);
	const shinma_skills = db.index.shinma_skills;

	let html = '<div class="container">';
	{
		const res = match.get_result.gvgResult;
		const guild_a = res.selfGuildName;
		const guild_b = res.enemyGuildName;
		const date = `${pad(4,dt.getFullYear())}/${pad(2,dt.getMonth()+1)}/${pad(2,dt.getDate())}`;
		const time = `${dt.getHours()}:${pad(2,dt.getMinutes())}:${pad(2,dt.getSeconds())}`;

		html += '<div class="row" justify-content-center>';
		html += '<div class="col">';
		html += `<h1>${guild_a} vs. ${guild_b}</h1>`;
		html += `<p>${date} ${time}</p>`;
		html += '</div>'
		html += '</div>';

		html += '<div class="row">';

		html += '<div class="col">';
		html += '<table class="table table-striped table-bordered table-sm"><thead><tr>';
		html += '<th></th>';
		html += `<th scope="col">${guild_a}</th>`;
		html += `<th scope="col">${guild_b}</th>`;
		html += '</tr></thead>';
		html += '<tbody>';

		const lifeforce_a = nf.format(res.selfTotalGuildPoint);
		const lifeforce_b = nf.format(res.enemyTotalGuildPoint);
		html += `<tr><th scope="row">Lifeforce</th><td>${lifeforce_a}</td><td>${lifeforce_b}</td></tr>`;

		const combo_a = nf.format(res.selfComboCount);
		const combo_b = nf.format(res.enemyComboCount);
		html += `<tr><th scope="row">Combo</th><td>${combo_a}</td><td>${combo_b}</td></tr>`;

		const ships_a = nf.format(res.selfSiegeWinCount);
		const ships_b = nf.format(res.enemySiegeWinCount);
		html += `<tr><th scope="row">Downed ships</th><td>${ships_a}</td><td>${ships_b}</td></tr>`;
		html += '</tbody></table>';
		html += '</div>'

		const shinma = match.get_result.gvgUltimateArtInfo.gvgUltimateArtDataList;
		html += '<div class="col">';
		html += '<table class="table table-striped table-bordered table-sm"><thead><tr>';
		html += '<th>Shinma</th>';
		html += `<th scope="col">${guild_a}</th>`;
		html += `<th scope="col">${guild_b}</th>`;
		html += '</tr></thead>';
		html += '<tbody>';
		html += generateShinmaCells(shinma[0], shinma_skills);
		html += generateShinmaCells(shinma[1], shinma_skills);
		html += '</tbody></table>';
		html += '</div>'


		html += '</div>';
	}

	{
		const rank_types = [
			"Lifeforce", "Recover",
			"Ally ATK Support", "Ally DEF Support",
			"Enemy ATK Debuff", "Enemy DEF Debuff",
			"Combo"
		];
		const mvp_ranks = match.get_result.gvgMvpRank;
		html += '<div class="row">';
		html += '<h2>Contribution Rank</h2>';
		for (let i = 0; i < mvp_ranks.length; i++)
		{
			const mvp_rank = mvp_ranks[i];
			html += '<div class="col-md-4">';
			html += '<div class="card">'
			html += '<div class="card-body">'
			html += `<h3 class="card-title">${rank_types[mvp_rank.type-1]}</h3>`;
			html += '<table class="table table-striped table-bordered table-sm"><tbody>';
			const list = mvp_rank.gvgMvpRankDetailList;
			for (let j = 0; j < list.length; j++) {
				html += '<tr class="text-center">';
				html += `<td rowspan="2" class="align-middle">${j+1}</td>`;
				html += `<td>${list[j].nameA}</td>`;
				html += `<td>${list[j].nameB}</td>`;
				html += '</tr>';
				html += '<tr class="text-end">';
				html += `<td>${nf.format(list[j].valueA)}</td>`;
				html += `<td>${nf.format(list[j].valueB)}</td>`;
				html += '</tr>';
			}
			html += '</tbody></table>';
			html += '</div>';
			html += '</div>';
			html += '</div>';
		}
		html += '</div>';
	}

	{
		const l = match.get_battle_user_list;
		html += '<div class="row">';
		html += '<div class="col">';
		html += generateMemberList(l.guildDataNameA, l.guildMemberA, db.index.characters);
		html += '</div>';
		html += '<div class="col">';
		html += generateMemberList(l.guildDataNameB, l.guildMemberB, db.index.characters);
		html += '</div>';
		html += '</div>';
	}
	html += '</div>';

	let content = document.getElementById("content");
	content.innerHTML = html;
}

async function updateView() {
	let params = new URLSearchParams(document.location.search);

	let view = params.get("view");
	if (!view)
		return;

	switch(view.toLowerCase())
	{
		case "history":
			const guild = params.get("guild");
			if (!guild)
				return;

			let historyUrl;
			switch (guild.toLowerCase()) {
				case "daydreamer":
					historyUrl = "match_history_Melesie.json";
					break;
				case "wildcard":
					historyUrl = "match_history_Ludmila.json";
					break;
				default:
					return;
			}

			await Promise.allSettled([
				cacheJson(historyUrl),
				cacheShinmaSkills()
			]);

			viewGuildHistory(historyUrl);
		break;

		case "match":
			const start_time = parseInt(params.get('time'));
			const guild_a = parseInt(params.get('a'));
			const guild_b = parseInt(params.get('b'));
			if (!start_time || !guild_a || !guild_b)
				return;

			const dt = new Date(start_time * 1000);

			let match_url = 'matches/';
			match_url += pad(4, dt.getUTCFullYear());
			match_url += '-';
			match_url += pad(2, dt.getUTCMonth() + 1);
			match_url += '-';
			match_url += pad(2, dt.getUTCDate());
			match_url += '_';
			match_url += pad(2, dt.getUTCHours());
			match_url += '-';
			match_url += pad(2, dt.getUTCMinutes());
			match_url += '-';
			match_url += pad(2, dt.getUTCSeconds());
			match_url += `_${pad(5, guild_a)}_vs_${pad(5, guild_b)}.json`;

			await Promise.allSettled([
				cacheJson(match_url, match_url),
				cacheShinmaSkills(),
				cacheCharacters(),
			]);

			viewMatch(dt, match_url);
		break;
	}
}

function asyncRequest(method, url) {
	return new Promise(function(resolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.open(method, url, true);
		xhr.onload = function() {
			if (this.status >= 200 && this.status < 300) {
				resolve(xhr.response);
			} else {
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			}
		};
		xhr.onerror = function() {
			reject({
				status: this.status,
				statusText: xhr.statusText
			});
		};
		xhr.send();
	});
}

async function cacheJson(url) {
	if (db.json.has(url)) {
		return;
	}

	let response = await asyncRequest("GET", url);
	db.json.set(url, JSON.parse(response));
}

async function cacheShinmaSkills() {
	if (db.index.shinma_skills) {
		return;
	}

	await cacheJson(en_ultimate_art_method_mst_list);

	const shinma_table = db.json.get(en_ultimate_art_method_mst_list);

	let shinma_skills = new Map();
	for (let i = 0; i < shinma_table.length; i++) {
		let shinma_mst = shinma_table[i];
		shinma_skills.set(shinma_mst.ultimateArtMethodMstId, shinma_mst);
	}

	db.index.shinma_skills = shinma_skills;
}

async function cacheCharacters() {
	if (db.index.characters) {
		return;
	}

	await cacheJson(en_character_mst_list);

	const character_mst_list = db.json.get(en_character_mst_list);
	let characters = new Map();
	for (let i = 0; i < character_mst_list.length; i++) {
		let mst = character_mst_list[i];
		characters.set(mst.characterMstId, mst);
	}

	db.index.characters = characters;
}

function pad(p, val) {
	return val.toString().padStart(p, '0');
}

window.addEventListener('load', updateView);
