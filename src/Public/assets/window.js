const c = new WebSocket(`ws://${window.location.host}`); 
c.onopen = ()=>{
	sendToMain("READY");
	sendToMain("PING");
}
c.onclose = ()=>{
	$("#sideMenu").remove();
	$("#main").css("left", "0")
	$("#main").css("width", "100%")
	$("#import, #importFile, #partyContainer").css("display", "none")
	$("#container").css("display", "block")
	$("#container").css("text-align", "center")
	$("#container").html("La connexion avec le serveur a été coupée. <a href='./'>Actualiser</a>")
}


$(document).bind("click", function(event) {
	$("#contextMenu").css("display", "none");
	$('#loadExtended').css('display', 'none');
	$('#favDiv').css('display', 'none');
});
$('img').attr('draggable', false);


function sendToMain(message, data = null){
	c.send(JSON.stringify({
		message,
		data,
	}));
}

const proxyRegex = /^(?:(\w+)(?::(\w+))?@)?((?:\d{1,3})(?:\.\d{1,3}){3})(?::(\d{1,5}))?$/

var metadata = {};

var ringOffset = 0;
var dofusOffset = 0;
const typeToPosition = (id) => {
	const typeToPositionObject = {
		13: 9, //dofus
		10: 6, //chapeau
		2: 1, //cac
		1: 0, //amulette
		3: 2, //anneau
		4: 3, //ceinture
		5: 5, //bottes
		11: 7, //cape
		12: 8, //familier
		7: 15, //bouclier
		21: 16 //monture
	}
	var position;
	
	if(id == 3){
		position = typeToPositionObject[id] + ringOffset;
		ringOffset = (ringOffset + 2) % 4;
	}
	else if(id == 13){
		position = typeToPositionObject[id] + dofusOffset;
		dofusOffset = (dofusOffset + 1) % 6;
	} else position = typeToPositionObject[id];
	
	return position;
};

function format(n){
	return n.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1.");
}



async function addAccount(username, click = false){
	const newAccountButton = `
		<a href='#' id='${username}' style='padding:10px;' onclick='if(!$(event.target).hasClass("checkmark")) show("${username}")'>
			<label class='radio'>
				<input type="checkbox" name='partyCheckbox' onclick='event.stopPropagation(); initPartyWindow()'>
				<span class="checkmark"></span>
			</label>
			<div>${username}: <span id='stateG' style='color:red;  font-style:italic;'>Offline</span></div>
		</a>`;
	
	$(".accounts").append(newAccountButton);
	
	$(".accounts").children(`#${username}`).on("mouseover", ()=>{
		$('.remove').attr("onclick", `removeAccount('${username}')`)
		$('.remove').css("width", 40)
		$('.remove').css("height", 40)
		$('.remove').css("top", $(`#${username}`).position().top)
		$('.remove').css("display", "block")
	})
	
	$(".accounts").children(`#${username}`).on("mouseout", ()=>{
		$('.remove').css("display", "none")
	})
	
	$('.remove').on("mouseover", ()=>{
		$('.remove').css("display", "block")
	})
	$('.remove').on("mouseout", ()=>{
		$('.remove').css("display", "none")
	})
	
	if(click) $(`#${username}`).click();
}

function removeAccount(username){
	if($('#'+username).parent().attr("id") && $('#'+username).parent().attr("id").includes('party')){
		deleteMember($('#'+username).parent().attr("id").split("party")[1], username)
	}
	
	$('#'+username).remove();
	$('.remove').css("display", "none");
	$('.add').click();
	
	sendToMain("REMOVE_ACCOUNT", {
		username
	})
	
	
}

var height;

function show(username){
	if($('#username').html().toLowerCase() == username.toLowerCase()) return;
	
	$(`.accounts a`).removeClass("active");
	
	$(`#${username}`).addClass("active"); 
	
	$("input[name='partyCheckbox']:checked").attr("checked", false)
	
	$("#username").html(username);
	$("#data>div").html("<p class='info'>Loading..</p>");
	
	$('#sendButton').attr("disabled", true); 
	$(".action").each((i, el) => $(el).attr("disabled", true));
	
	$(".nodisabled").each((i, el) => $(el).attr("disabled", false));
	$("#dataB").attr("disabled", false);
	$("#configB").attr("disabled", false);
	$(".memory").attr("disabled", false);
	$("#refreshHDV").attr("disabled", false);
	
	$("#scriptName").html("");
	$("#script").val(null);

	$(".login").attr("disabled", false);
	$(".login").html("Connexion");
	
	
	if($("#container").css("display") == "none"){
		$("#import, #importFile, #partyContainer").css("display", "none")
		$("#container").css("display", "block")
	}
	
	sendToMain("SEND_SAUCE", {
		username
	})
	
	/*show loading cursor until sauce is ready*/
	/*if($("#import").css("display") == "block") $("#import").css("display", "none")
	if($("#container").css("display") == "block") $("#container").css("display", "none")
	$("#loading").css("display", "block")*/
	
	/*We wait for the server to notify us that the sauce is ready (we show container and hide menu on that event)*/
	// if($(".toggleMenu").children("i").attr("class") == "fa fa-chevron-left") toggleMenu(".toggleMenu")
}


function switchDiv(username, id){
	const tabs = ["#data", "#char", "#hdv", "#fight", "#mapGrid", "#config"];
	
	for(const tab of tabs){
		$(tab).css("display", "none");
		$(tab+"B").removeClass("active");
	}
	$("#"+id).css("display", "block");
	$("#"+id+"B").addClass("active");
	
	$("#data").scrollTop($("#data").prop("scrollHeight"));
}

function switchCharacterDiv(username, id){
	const tabs = ["#stats", "#inv", "#spells", "#jobs"];
			
	for(const tab of tabs){
		$(tab).css("display", "none");
		$(tab+"B").removeClass("active");
	}
	
	$("#"+id).css("display", id == 'inv' ? "flex" : "block");
	$("#"+id+"B").addClass("active");
}

function showLoad(e){
	$('#loadExtended').css('left', $(e).position().left - $(e).outerWidth()/2)
	$('#loadExtended').css('top', $(e).position().top - $(e).outerHeight() - 2)
	$('#loadExtended').css('display', 'block')
}
function showFavDiv(e){
	console.log($(e).parent().position(), $(e).parent().outerWidth())
	/*const top = $(e).parent().position().top 
		+ $(e).outerHeight() + 2 //compensate for the showLoad() offset
		// + $(e).parent().outerHeight() + 2*/
		
	const top = $("#container").position().top //we basically want it on the same level as $("#load") and that does it because $("#load") is at the top of $("#container")
				+ 20 //padding
				
	$('#favDiv').css('left', $(e).parent().position().left - $(e).parent().outerWidth()/2)
	$('#favDiv').css('top', top)
	$('#favDiv').css('display', 'flex')
}

function showEffects(e, html){
	if(html == "<ul></ul>") return;
	
	
	
	$(".effectDiv").html(html);
	
	const itemElement = $(e);
	
	const x = itemElement.parent().prop('cellIndex') || 0
	const y = itemElement.parent().parent().prop('rowIndex') || 0
	
	const size = itemElement.width();
	var left = itemElement.position().left + size + size*x;
	// var left = event.pageX;
	var top = itemElement.position().top  + size + size*y;
	// var top = event.pageY;
	
	if(left > $("#inv").width() - $(".effectDiv").width()){
		// if(false){
		left = left - ($(".effectDiv").width() + size)
		// left = left - 2*size
	}
	
	if(top > $("#inv").height() - $(".effectDiv").height()){
		top = top - ($(".effectDiv").height() + size)
		// top = top - 2*size;
	}

	$(".effectDiv").css("display", "block"); 
	$(".effectDiv").css("left", left); 
	$(".effectDiv").css("top", top);
	
}


const globals = ["IMPORT", "PARTIES"]
c.onmessage = async (e) => {
	const {message, data} = JSON.parse(e.data);
	if(message == "STATE_UPDATE"){
		$(`#${data.username} #stateG`).html(data.state[0].toUpperCase() + data.state.slice(1).toLowerCase());
		$(`#${data.username} #stateG`).css("color", data.color ? data.color : "var(--secondaryText)");
	}
	
	if(data && data.username && $('#username').html().toLowerCase() != data.username.toLowerCase() && !globals.includes(message)) return;
		
	switch(message){
		case "FAV_SCRIPTS":
			$("#fav").css("color", data.includes($("#scriptName").html()) ? "green" : "red")
			$("#favDiv").html("")
			for(var script of data){
				$("#favDiv").append(`<a href='#' onclick='loadScript($("#username").html(), "${script}")'>${script}</a>`)
			}
			if($("#favDiv").html() == "") $("#favDiv").append("<p><i>Aucun script favoris</i></p>")
			$("#favDiv").append("<span style='font-size:0.3em; color:white; margin-left:auto;'>Ever Princess#7314</span>")
			break;
			
			
		case "CAPTCHA":
			sendToMain("SOLVE_CAPTCHA", {
				username: data.username,
				captchaKey: $("#anticaptcha").val(),
				key: data.key
			})
			break;
			
			
		case "STATS":
			$('#cpu').html(data.cpu)
			$('#mem').html(data.mem)
			// $('#ping').html(data.ping)
			break;
			
			
		case "PONG":
			$('#ping').html(data.time)
			$('#ping').css("color", data.color)
			setTimeout(()=>sendToMain("PING"), 2000)
			break;
			
			
		case "VERSIONS": 
			$('#build').html(data.buildVersion || "error")
			$('#app').html(data.appVersion || "error")
			$('#assets').html(data.assetsVersion || "error")
			metadata = data;
			break;
		
		
		case "ACCOUNTS": 
			// console.log(data)
			var promises = [];
			for(const e of data) promises.push(addAccount(e.username))
				
			// while($(".accounts>a").length < data.length) continue;
			// while(sauceReady < data.length) continue;
			
			await Promise.all(promises)
			
			sendToMain("SEND_STATES")
			break;
		
		
		case "IMPORT":
			$(".import").attr("disabled", false);
			if(data.reason){
				$(".err").css("display", "block");
				$(".err").html(data.reason);
			} else {
				$(".err").css("display", "none");
				$(".err").html("");
				addAccount(data.username, true)
			}
			break;
		
		case "LOGIN_SUCCESS": 			
			$("#load").attr("disabled", false);
			$("#loadExtended>.action").attr("disabled", false);
			$("#hdvB").attr("disabled", false);
			$("#sitB").attr("disabled", false);
			$(".login").html("Déconnexion");
			$('#sendButton').attr("disabled", false); 
			break;
		
		
		case "LOGIN_FAILED":			
			$("#load").attr("disabled", true);
			$("#loadExtended>.action").attr("disabled", true);
			$("#start").attr("disabled", true);
			$("#stop").attr("disabled", true);
			
			$("#sitB").attr("disabled", true);
			$("#quitB").attr("disabled", true);
			
			$("#scriptName").html("");
			$("#script").val(null);
			
			$(".login").attr("disabled", false);
			$(".login").html("Connexion");
			
			if(data.reason == "DISCONNECTED") login(data.username)
			else if(data.reason == "DISCONNECTED: Attente du modérateur (30 mins)") sendToMain("MODERATOR", {username: data.username})
			break;
		
		
		case "LOG":
			$("#data>div").append(data.html.replace(">", "><span style='color:white;'>[" + (new Date().toTimeString().split(' ')[0]) + "] </span>"));
			$("#data").scrollTop($("#data").prop("scrollHeight"));
			break;
			
			
		case "STATE_UPDATE":
			/**
				username,
				state,
				color
			**/
			$("#state").html(data.state[0].toUpperCase() + data.state.slice(1).toLowerCase());
			$("#state").css("color", data.color ? data.color : "var(--secondaryText)");
			
			
			// $("#chat").val($("#chat").val())
			if(data.state == "OFFLINE"){
				$('#sendButton').attr("disabled", true); 
				$(".action").each((i, el) => $(el).attr("disabled", true));
				$("#dataB").attr("disabled", false);
				$("#configB").attr("disabled", false);
				$(".memory").attr("disabled", false);
			}
			else if(data.state == "IDLE"){
				$('#sendButton').attr("disabled", false); 
				$("#leaveB").attr("disabled", false);
			}
			else if(data.state == "LOGGING IN"){
				$(".login").attr("disabled", false);
			}
			else if(data.state == "SWITCHING TO GAME"){
				$(".login").attr("disabled", true);
			}
			else if(data.state == "INITIALIZING"){
				$(".login").attr("disabled", false);
			}
			
			if(data.state == "FIGHTING"){
				$("#sitB").attr("disabled", true);
				$("#quitB").attr("disabled", false);
				$("#leaveB").attr("disabled", true);
			} else {
				$("#sitB").attr("disabled", false);
				$("#quitB").attr("disabled", true);
				$("#leaveB").attr("disabled", false);
			}
			break;
			
			
		case "MAP":
			/**
				username: str,
				pos: str,
				id: int,
				subArea: str,
				accessibleCells: array,
				obstacleCells: array,
				interactiveElementsIds: array,
				actorCells: array,
				chmichat: array,
				top: int,
				bottom: int,
				left: int,
				right: int,
				fight: bool
			**/
			if(!data) break;
			$("#map").html(`${data.subArea} - ${data.pos}`);
			$(".mapContainer").html(mapHtml);
			
			// console.log(data)
			var colors = {
				"player": "#8076d0",
				"monster": "red",
				"me": "#ffa500",
				"npc": "#94b2b2",
				"marchand": "#8B4513"
			}
			
			
			for(const cellId of data.obstacleCells) $("."+cellId).css("background-color", "#777777")
				
			for(const cellId of data.accessibleCells){
				$("."+cellId).css("background-color", "#fff")
				$("."+cellId).css("cursor","pointer");
			}
			
			// if(!data.fight){
				for(const actor of data.actorCells){
					if(!data.fight || (data.fight && ["player", "monster", "me"].includes(actor.type)))
						$("."+actor.cell).append('<i id="'+actor.id+'" style="background-color:' + colors[actor.type]+ ';" class="' /*+ (actor.agro ? "fa fa-exclamation-triangle " : "")*/ + actor.type + ' circle"></i>')
					if(actor.name){
						const title = $("."+actor.cell).attr('title') + "\n" + actor.name;
						$("."+actor.cell).attr('title', title)
					}
					
				}
			
			
				for(const element of data.interactiveElementIds){
					if(element.enabledSkills.length == 0 && element.disabledSkills.length == 0){
						$("."+element.cell).html('<i id="'+element.id+'" style="background-color:#00ffff; display:none;" class="interactive circle"></i>')
					} else {
						$("."+element.cell).html('<i id="'+element.id+'" style="background-color:#00ffff; opacity:' + (element.enabledSkills.length > 0 ? "1" : "0.5") + '; cursor:' + (element.enabledSkills.length > 0 ? "pointer" : "not-allowed") + ';" class="interactive circle"></i>')
						$("."+element.cell).attr('title', element.name)
					}
					
					// console.log(`openMenu('${data.username}', ${element.id}, ${JSON.stringify(element.enabledSkills)}, ${JSON.stringify(element.enabledSkills)})`)
					$("#"+element.id).attr("onclick", `openMenu('${data.username}', ${element.id}, ${JSON.stringify(element.enabledSkills)}, ${JSON.stringify(element.disabledSkills)})`)
				}
				
				for(const cell of data.chmichat) $("."+cell).append("<i class='chmicha'><img src='./slots/chmicha.png' width='28' height='28'></i>")
				
			// }
			$("#mapGridB").attr("disabled", false);
			
			$("#players").html($('.player').length + 1)
			$("#merchants").html($('.marchand').length)
			$("#npcs").html($('.npc').length)
			$("#monsters").html($('.monster').length)
			$("#interactiveEls").html($('.interactive').length)
			
			$(".monster").attr("onclick", `event.stopImmediatePropagation(); sendToMain("FIGHT", {username: '${data.username}', cell: $(this).parent().attr("class").split(" ")[1], id: $(this).attr("id")})`)
			// $(".interactive").attr("onclick", `sendToMain("USE_INTERACTIVE", {username: '${data.username}', id: $(this).attr("id")})`)
			// $(".interactive").attr("onclick", `sendToMain("USE_INTERACTIVE", {username: '${data.username}', id: $(this).attr("id")})`)
			
			
			$("#mapid").html(data.id)
			
			$(".left").attr("disabled", data.left == false);
			$(".right").attr("disabled", data.right == false);
			$(".bottom").attr("disabled", data.bottom == false);
			$(".top").attr("disabled", data.top == false);
			break;
			
			
		case "INTERACTIVE_UPDATE":			
			if(data.element.enabledSkills.length == 0 && data.element.disabledSkills.length == 0){
				$(`#${data.element.id}`).css("display", "none")
			} else {
				if($(`#${data.element.id}`).css("display") == "none") $(`#${data.element.id}`).css("display", "block")
				$(`#${data.element.id}`).css("opacity", data.element.enabledSkills.length > 0 ? '1' : '0.5');
				$(`#${data.element.id}`).css("cursor", data.element.enabledSkills.length > 0 ? 'pointer' : 'not-allowed');
				$("#"+data.element.id).attr("onclick", `openMenu('${data.username}', ${data.element.id}, ${JSON.stringify(data.element.enabledSkills)}, ${JSON.stringify(data.element.disabledSkills)})`)
			}
			break;
		
		
		
		case "UPDATE_MAP_ACTORS":
			var colors = {
				"player": "#8076d0",
				"monster": "red",
				"me": "#ffa500",
				"npc": "#94b2b2",
				"marchand": "#8B4513"
			}
			
			// console.log(data)
			
			if(data.fight){
					if(!data.fightAdd){
						$(".player").remove()
						$(".monster").remove()
						$(".me").remove()
						$(".npc").remove()
						$(".marchand").remove()
					}
					
					for(const actor of data.actors){
						$("."+actor.cell).append('<i id="'+actor.id+'" style="background-color:' + colors[actor.type]+ ';" class="' + actor.type + ' circle"></i>')
						if(actor.name){
							const title = $("."+actor.cell).attr('title') + "\n" + actor.name;
							$("."+actor.cell).attr('title', title)
						}	
					}
			}
			
			if(data.placements){
				$(".challenger").removeClass("challenger")
				$(".defender").removeClass("defender")
				for(const cellId of data.placements.challengers) $("."+cellId).addClass("challenger")
				for(const cellId of data.placements.defenders) $("."+cellId).addClass("defender")
			}
			
			
			if(data.oldActor){
				$("#"+data.oldActor.id).remove();
				if(!$("."+data.oldActor.cell).attr('title')) $("."+data.oldActor.cell).attr('title', "") 
				const title = $("."+data.oldActor.cell).attr('title').replace("\n" + data.oldActor.name, '');
				// console.log("old", title)
				$("."+data.oldActor.cell).attr('title', title)
			}
			if(data.newActor && $("#"+data.newActor.id).html() != ""){
				$("."+data.newActor.cell).append('<i id="'+data.newActor.id+'" style="background-color:' + colors[data.newActor.type]+ ';" class="' + data.newActor.type + ' circle"></i>')
				if(data.newActor.name){
					if(!$("."+data.newActor.cell).attr('title')) $("."+data.newActor.cell).attr('title', "") 
					const title = $("."+data.newActor.cell).attr('title') + "\n" + data.newActor.name;
					// console.log("new", title)
					$("."+data.newActor.cell).attr('title', title)
				}
			
			}

			$("#players").html($('.player').length)
			$("#merchants").html($('.marchand').length)
			$("#npcs").html($('.npc').length)
			$("#monsters").html($('.monster').length)
			$("#interactiveEls").html($('.interactive').length)
			
			$(".monster").attr("onclick", `event.stopImmediatePropagation(); sendToMain("FIGHT", {username: '${data.username}', cell: $(this).parent().attr("class").split(" ")[1], id: $(this).attr("id")})`)
			break;
			
			
		case "SET_PATH":			
			data.path.shift()	
			for(const cell of data.path) $("."+cell).append("<i class='fa fa-times path'></i>")
			break;
		
		
		case "CLEAR_PATH":
			$(".path").each((i, el) => $(el).remove())
			break;
			
		case "AGRO":
			$("."+data.cell).append("<i class='fa fa-exclamation-triangle path'></i>")
			break;
		
		case "SCRIPT_LOADED":
			/**
				username
				name
			**/
			$("#fav").attr("disabled", false); 
			$("#fav").css("color", $("#favDiv>a").map(function() {return this.innerHTML}).toArray().includes(data.name) ? "green" : "red")
			
			$("#start").attr("disabled", false); 
			$("#stop").attr("disabled", true); 
			$("#scriptName").html(data.name);
			$("#script").val(null);
			break;
			
			
		case "SCRIPT_START":
			/**
				username
			**/
			$("#start").attr("disabled", true); 
			$("#stop").attr("disabled", false); 
			break;
			
		
		case "UPDATE_CHARACTER_LOOK":
			/**
				username
				look: {
					character: url
					follower: url
				}
			**/
			
			
			$(".characterDisplay").attr("onerror", `this.src = '${$(".characterDisplay").attr("src")}';`);
			$(".characterDisplay").attr("src", `${data.look.character}`);
			
			if(data.look.follower){
				$(".characterFollower").css("visibility", "visible");
				$(".characterFollower").attr("onerror", `this.src = '${$(".characterFollower").attr("src")}';`);
				$(".characterFollower").attr("src", `${data.look.follower}`);
			} else {
				$(".characterFollower").css("visibility", "hidden");
			}
			break;
			
			
		case "INVENTORY_INIT":
			$("#charB").attr("disabled", false);
			$("#invB").attr("disabled", false);
			const set = {
				necklaceId: data.items.find(e => e.position == 0),
				cacId: data.items.find(e => e.position == 1),
				ring1Id: data.items.find(e => e.position == 2),
				beltId: data.items.find(e => e.position == 3),
				ring2Id: data.items.find(e => e.position == 4),
				bootsId: data.items.find(e => e.position == 5),
				hatId: data.items.find(e => e.position == 6),
				capeId: data.items.find(e => e.position == 7),
				petId: data.items.find(e => e.position == 8),
				dofus1Id: data.items.find(e => e.position == 9),
				dofus2Id: data.items.find(e => e.position == 10),
				dofus3Id: data.items.find(e => e.position == 11),
				dofus4Id: data.items.find(e => e.position == 12),
				dofus5Id: data.items.find(e => e.position == 13),
				dofus6Id: data.items.find(e => e.position == 14),
				shieldId: data.items.find(e => e.position == 15),
				mountId: data.items.find(e => e.position == 16)
			}
			
			// console.log(set)
			
			for(const el in set){
				// console.log(set[el])
				if(set[el]){
					// if(el == "shieldId") $(".shieldEquipped").css("background", `url('https://dofustouch.cdn.ankama.com/assets/${metadata.assetsFullVersion}/gfx/items/${set[el].icon}.png') no-repeat center top`)
					$(`.${el.replace("Id", "")}`).attr("src", `https://dofustouch.cdn.ankama.com/assets/${metadata.assetsFullVersion}/gfx/items/${set[el].icon}.png`);
					
					$(`.${el.replace("Id", "")}`).attr("id", `UID${set[el].UID}`);
					$(`.${el.replace("Id", "")}`).attr("onclick", `moveItem('${data.username}', $(this).attr('id').replace('UID', ''))`);
					
					$(`.${el.replace("Id", "")}`).addClass("item");
					$(`.${el.replace("Id", "")}`).attr("onmouseover", `showEffects(this, "${set[el].effects}")`);
					$(`.${el.replace("Id", "")}`).attr("onmouseout", `$(".effectDiv").css("display", "none");`)
				}
				
			}
			
			
			$(".characterDiv").css("background-image", `url("https://dofustouch.cdn.ankama.com/assets/${metadata.assetsFullVersion}/gfx/illusUi/symboles_classe/FichePerso_tx_symboleClasse_frame${data.breed - 1}.png")`);
			$(".items").html("");
			data.items.filter(e => e.position > 15).forEach((item, i) => {
				const bg = `https://dofustouch.cdn.ankama.com/assets/${metadata.assetsFullVersion}/gfx/items/${item.icon}.png`;
				
				$(".items").append(`
					<div id = 'UID${item.UID}' class='item' style='' title = "${item.name}">
						<span style='position:absolute; right:0; bottom:-1px; font-size:0.8em; font-weight:bold;'>x${item.quantity}</span>
					</div>
				`);
				$(`#UID${item.UID}`).css("background-image", `url("${bg}")`);
				$(`#UID${item.UID}`).attr("onclick", `moveItem('${data.username}', $(this).attr('id').replace('UID', ''), ${typeToPosition(item.type.type)})`);
				$(`#UID${item.UID}`).attr("onmouseover", `showEffects(this, "${item.effects}")`);
				$(`#UID${item.UID}`).attr("onmouseout", `$(".effectDiv").css("display", "none");`)

			})
			$("#kamas").html(format(data.kamas));
			break;
			
			
		case "OBJECT_MOVEMENT":
			// data.items
			
			const item = data.items.find(e => e.UID == data.UID);
			const classes = [
				"necklace",
				"cac",
				"ring1",
				"belt",
				"ring2",
				"boots",
				"hat",
				"cape",
				"pet",
				"dofus1",
				"dofus2",
				"dofus3",
				"dofus4",
				"dofus5",
				"dofus6",
				"shield",
				"mount"
			]			
			
			if(data.oldPosition <= 15){
				$(`.${classes[data.oldPosition]}`).attr("src", "");
				$(`.${classes[data.oldPosition]}`).attr("id", "");
			}
			else $(`#UID${data.UID}`).remove();
			
			if(item.position <= 15){
				$(`.${classes[item.position]}`).attr("src", `https://dofustouch.cdn.ankama.com/assets/${metadata.assetsFullVersion}/gfx/items/${item.icon}.png`);
				
				$(`.${classes[item.position]}`).attr("id", `UID${item.UID}`);
				$(`.${classes[item.position]}`).attr("onclick", `moveItem('${data.username}', $(this).attr('id').replace('UID', ''))`);
				
				$(`.${classes[item.position]}`).addClass("item");
					$(`.${classes[item.position]}`).attr("onmouseover", `showEffects(this, "${item.effects}")`);
					$(`.${classes[item.position]}`).attr("onmouseout", `$(".effectDiv").css("display", "none");`)
			} 
			else{
				if($(`#UID${item.UID}`).html() || $(`#UID${item.UID}`).html() == ""){
					try{
						$(`#UID${item.UID}`).css('background-image' `url(https://dofustouch.cdn.ankama.com/assets/${metadata.assetsFullVersion}/gfx/items/${item.icon}.png)`)
					}catch(e){
						console.log(e.message, `https://dofustouch.cdn.ankama.com/assets/${metadata.assetsFullVersion}/gfx/items/${item.icon}.png`)
					}
					$(`#UID${item.UID}`).children('span').html(`x${item.quantity}`);
				} 
				else {
					const bg = `https://dofustouch.cdn.ankama.com/assets/${metadata.assetsFullVersion}/gfx/items/${item.icon}.png`;
					$(".items").append(`
						<div id = 'UID${item.UID}' class='item' style='' title = "${item.name}">
							<span style='position:absolute; right:0; bottom:-1px; font-size:0.8em; font-weight:bold;'>x${item.quantity}</span>
						</div>
					`);
					$(`#UID${item.UID}`).css("background-image", `url("${bg}")`);
					$(`#UID${item.UID}`).attr("onclick", `moveItem('${data.username}', $(this).attr('id').replace('UID', ''), ${typeToPosition(item.type.type)})`);
					$(`#UID${item.UID}`).attr("onmouseover", `showEffects(this, "${item.effects}")`);
					$(`#UID${item.UID}`).attr("onmouseout", `$(".effectDiv").css("display", "none");`)
				}
			}
			break;
			
			
		case "INVENTORY_UPDATE":						
			if($(`#UID${data.item.UID}`).html() || $(`#UID${data.item.UID}`).html() == ""){
				try{
					$(`#UID${data.item.UID}`).css('background-image' `url(https://dofustouch.cdn.ankama.com/assets/${metadata.assetsFullVersion}/gfx/items/${data.item.icon}.png)`)
				}catch(e){
					console.log(e.message, `https://dofustouch.cdn.ankama.com/assets/${metadata.assetsFullVersion}/gfx/items/${data.item.icon}.png`)
				}
				$(`#UID${data.item.UID}`).children('span').html(`x${data.item.quantity}`);
			} 
			else {
				const bg = `https://dofustouch.cdn.ankama.com/assets/${metadata.assetsFullVersion}/gfx/items/${data.item.icon}.png`;
				$(".items").append(`
					<div id = 'UID${data.item.UID}' class='item' style='' title = "${data.item.name}">
						<span style='position:absolute; right:0; bottom:-1px; font-size:0.8em; font-weight:bold;'>x${data.item.quantity}</span>
					</div>
				`);
				$(`#UID${data.item.UID}`).css("background-image", `url("${bg}")`);
			}
			
			$(`#UID${data.item.UID}`).attr("onclick", `moveItem('${data.username}', $(this).attr('id').replace('UID', ''), ${typeToPosition(data.item.type.type)})`);
			$(`#UID${data.item.UID}`).attr("onmouseover", `showEffects(this, "${data.item.effects}")`);
			$(`#UID${data.item.UID}`).attr("onmouseout", `$(".effectDiv").css("display", "none");`)
			break;
			
			
		case "OBJECT_QUANTITY":
			if(data.item){
				$(`#UID${data.item.UID}`).children("span").html(`x${data.item.quantity}`);
			} else {
				$(`#UID${data.UID}`).remove();				
			}
			break;
			
			
		case "KAMAS_UPDATE":
			$("#kamas").html(format(data.kamas));
			break;
			
			
		case "WEIGHT_UPDATE":
			$("#weight>span").css("width", `${data.weight*100/data.maxWeight}%`);
			$("#weight>p").html(`${data.weight} / ${data.maxWeight}`);
			$("#weight").attr("title", `${(data.weight*100/data.maxWeight).toFixed(2)}%`);
			break;
			
			
		case "STATS_UPDATE":			
			$("#charB").attr("disabled", false);
			$("#statsB").attr("disabled", false);
			
			var statHtml = "<div style='display:flex; justify-content:space-around;'><div style='width:40%;'><ul class='statsMenu'>"
			for(stat in data.stats){
				// const statId = characCodes[stat];
				const cost = data.stats[stat].cost
				statHtml += `<li><img src = "./slots/${stat}.png"> <p style = "color: ${data.bestElement == data.stats[stat].value ? 'red' : 'black'};">${data.stats[stat].value} </p>`;
				if(data.statsPoints >= cost) statHtml += `<button style='border:2px solid transparent; height:25px; width:25px; margin: 0; vertical-align: middle; font-size: 1em;' href='#' class='add' onclick='sendToMain("UPGRADE_STAT", {username: "${data.username}", statName: "${stat}", cost: ${cost}})'>+</button>`
				statHtml += "</li>"
			}
			statHtml += "</div></ul>"
						
			statHtml += `
				<div style='width:40%;'>
					<ul class='statsMenu'>
						<li><img src = "./slots/actionPoints.png"> <p style = "color: black;">${data.actionPoints}</p></li>
						<li><img src = "./slots/movementPoints.png"> <p style = "color: black;">${data.movementPoints}</p></li>
						<li><img src = "./slots/initiative.png"> <p style = "color: black;">${data.initiative}</p></li>
						<li><img src = "./slots/range.png"> <p style = "color: black;">${data.range}</p></li>
						<li><img src = "./slots/summon.png"> <p style = "color: black;">${data.summons}</p></li>
						<li><img src = "./slots/prospecting.png"> <p style = "color: black;">${data.prospecting}</p></li>
						
					</ul>
					
				</div>
				<p class='carac'>Points de caractéristiques: <span style='color:white;'>${data.statsPoints}</p>
				
				<div class = 'autoUp'>
					<p style='margin:0 0 5px 0; text-align: center;'>Augmenter automatiquement:</p>
					<select id = 'autoUpgradeCharac' onchange = 'autoUpgradeCharac("${data.username}", parseInt($(this).val()))'>
						<option value='' style = 'font-style: italic;'>Aucune caractéristique</option>
						<option value='11'>Vitalité</option>
						<option value='12'>Sagesse</option>
						<option value='10'>Force</option>
						<option value='15'>Intelligence</option>
						<option value='13'>Chance</option>
						<option value='14'>Agilité</option>
					</select>
				</div>
				</div>
			`
			
			$("#stats").html(statHtml)
			
			$("#autoUpgradeCharac").find(`[value='${data.autoUpgrade}']`).attr("selected", true)
			
			$("#health>span").css("width", `${data.lifePoints*100/data.maxLifePoints}%`);
			$("#health>p").html(`${data.lifePoints} / ${data.maxLifePoints}`);
			$("#health").attr("title", `${(data.lifePoints*100/data.maxLifePoints).toFixed(2)}%`);
			
			$("#energy>span").css("width", `${data.energyPoints*100/10000}%`);
			$("#energy>p").html(`${data.energyPoints} / ${10000}`);
			$("#energy").attr("title", `${(data.energyPoints*100/10000).toFixed(2)}%`);
			
			$("#exp>span").css("width", `${data.experienceLevel*100/data.experienceNextLevel}%`);
			$("#exp>p").html(`Niv. <b>${data.level}</b>: <span style='margin-left:4px;'>${(data.experienceLevel*100/data.experienceNextLevel).toFixed(2)}%</span>`);
			$("#exp").attr("title", `${format(data.experienceLevel)} / ${format(data.experienceNextLevel)}`);
			
			$("#spellPoints").html(data.spellPoints)
			break;
			
		
		case "HEALTH_UPDATE":
			$("#health>span").css("width", `${data.lifePoints*100/data.maxLifePoints}%`);
			$("#health>p").html(`${data.lifePoints} / ${data.maxLifePoints}`);
			break;
			
			
			
		case "SPELLS_UPDATE":
			$("#fightB").attr("disabled", false);
			$("#charB").attr("disabled", false);
			$("#spellsB").attr("disabled", false);
			// console.log("zab")
			var spellsHtml = `
			<div>
				<center><span style='color:var(--text); font-size:1vw;'>Cochez les cases pour configurer l'augmentation automatique des sorts.</span></center>
				<ul class='statsMenu' style='padding:0; display: flex; flex-wrap: wrap; flex-direction: column;'>
			`
			var fightConfig = ''
			for(spell of data.spells){
				const spellImg = `https://dofustouch.cdn.ankama.com/assets/${metadata.assetsFullVersion}/gfx/spells/sort_${spell.icon}.png`
				spellsHtml += `<li  style='flex-grow: 1;  position: relative;'>
						
						<label class='radio'>
							<input type="checkbox" name="autoUpgradeSpells" id = 'autoUpgradeSpell${spell.id}' onchange = 'autoUpgradeSpells("${data.username}", ${spell.id})'>
							<span class="checkmark number"></span>
						</label>
					  
						<img style='margin-left: 10px;' src = "${spellImg}"> <p style='padding-right:20px;'>${spell.name}: <span style='color: white;'>${spell.level} </p>
						
					
				`;
				if(data.spellPoints >= spell.level && (spell.level <= 5 && data.characterLevel >= spell.minRequiredLevel)) spellsHtml += `<button style='border:2px solid transparent; margin-left:20px; height:25px; width:25px; margin: 0; vertical-align: middle; font-size: 1em;' href='#' class='add' onclick='sendToMain("UPGRADE_SPELL", {username: "${data.username}", spellId: ${spell.id}, level: ${spell.level+1}})'>+</button>`
				spellsHtml += "</li>"
				
				fightConfig += `<img class='spell' src="${spellImg}" id='spell${spell.id}' name = '${spell.name}' onclick = 'if($(this).hasClass("addSpellDisabled")) return; $(".selected").removeClass("selected"); $(this).addClass("selected")'>`
			}
			spellsHtml += "</ul>"
			
			spellsHtml += "<p class='spellPoints'>Points de sorts: <span style='color:white;' id = 'spellPoints'> "+data.spellPoints+"</p></div>"
			
			
			$("#spells").html(spellsHtml)
			$("#spellsFight").html(fightConfig)
			
			for(const i in data.autoUpgrade){
				const id = data.autoUpgrade[i];
				$(`#autoUpgradeSpell${id}`).attr("checked", true)
				$(`#autoUpgradeSpell${id}`).siblings(".number").attr("id", parseInt(i)+1)
			}
			
			if($("#auto").attr("checked") == "checked"){
				$("#spellsFight").find(".spell").addClass("addSpellDisabled");
				$("#instructions").find("input, button, submit, textarea, select").attr("disabled", true);
			} else $("#spellsFight").children().first().addClass("selected")
			break;
			
		
		case "SHOP_UPDATE":
			$("#hdvB").attr("disabled", false);
			$("#refreshHDV").attr("disabled", false);
			
			if($(`#SHOPUID${data.item.UID}`).html()) $(`#SHOPUID${data.item.UID}`).remove()
			
			if(data.item.name)
				$('#shopTable').append(`<tr id='SHOPUID${data.item.UID}'></tr>`)
				$(`#SHOPUID${data.item.UID}`).append(`
					<td>${data.item.UID}</td>
					<td>${data.item.name}</td>
					<td>${data.item.quantity}</td>
					<td>${format(data.item.price)}K</td>
					<td>${data.item.expiration}H</td>
				`)
			break;
			
			
		case "CREATE_CHARACTER_CONFIRM":
			/**
				username,
				breed: (optional)
			**/
			if(data.breed){
				$("#createCharacterContainer").html(`<p class='success' style='display:inline;'>La création d'un ${data.breed} sera effectuée à la prochaine connexion.</p>`)
				$("#createCharacterButton").html(`Annuler`)
				$("#createCharacterButton").attr("onclick", `cancelCharacterCreation("${data.username}")`)
				$("#createCharacterButton").css("background-color", "red")
				$("#createCharacterButton").css("color", "white")
			} else {
				$("#createCharacterContainer").html(
					`
						Créer un nouveau personnage: <select id="newCharacter" style='margin-left:10px; width:150px;'>
								<option value="1">Féca</option>
								<option value="2">Osamodas</option>
								<option value="3">Enutrof</option>
								<option value="4">Sram</option>
								<option value="5">Xélor</option>
								<option value="6">Ecaflip</option>
								<option value="7">Eniripsa</option>
								<option value="8">Iop</option>
								<option value="9">Crâ</option>
								<option value="10">Sadida</option>
								<option value="11">Sacrieur</option>
								<option value="12">Pandawa</option>
								<option value="13">Roublard</option>
								<option value="14">Zobal</option>
								<option value="15">Steamer</option>
							</select>
					`
				)
				$("#createCharacterButton").html(`Créer`)
				$("#createCharacterButton").attr("onclick", `createCharacter("${data.username}", parseInt($("#newCharacter").val()))`)
				$("#createCharacterButton").css("background-color", "var(--borders)")
				$("#createCharacterButton").css("color", "black")
			}
			break;
			
			
		case "FIGHT_INSTRUCTIONS":
			$("#instructions").html("")
			
			if(!data.instructions) break;
			for(const instruction of data.instructions){
				addInstruction(data.username, instruction.spellId, instruction.name, instruction.cacOnly, instruction.toCellId, instruction.toCellIdText, instruction.repeat, false)
			}
			break;
			
		
		case "JOB_UPDATE":
			$("#jobsB").attr("disabled", false);
			
			var jobHtml = ""
			
			for(const id in data.jobs){
				const job = data.jobs[id];
				const percent = job.experienceLevel*100/job.experienceNextLevel;
				
				var skillsHtml = "";
				for(const skill of job.skills){
					if(!skill) continue;
					const qt = skill.min == skill.max ? skill.min : `${skill.min}-${skill.max}`
					skillsHtml += `
						<div class='item' 
							style='background-image:url(https://dofustouch.cdn.ankama.com/assets/2.37.3_*UpeckluU6zqk8,shazO*oz2B4PEe0Wc/gfx/items/${skill.item.icon}.png); background-repeat:no-repeat; background-position:top left; background-size:95%; display:inline-block;' 
							title = '${skill.item.name}'
						>
							<span style='position:absolute; right:0; bottom:-1px; font-size:0.8em; font-weight:bold;'>${qt}</span>
						</div>
					`
				}
				
				if(skillsHtml == "") skillsHtml = "<p style='color:var(--secondaryText);'><i>Ce métier ne récolte aucun item en ce moment.</i></p>"
				jobHtml += `
					<div class = 'job'>
						<div class='jobExp'>
							
							<svg class="progress-ring" height="120" width="120">
							  <circle class="progress-ring__circle" stroke-width="3" stroke="var(--buttonHover)" fill="transparent" r="58" cx="60" cy="60" style='stroke-dashoffset: ${364.424747816416 * (1 - percent / 100)};' />
							  <circle class="progress-ring__circle" stroke-width="0.5" stroke="var(--buttons)" fill="transparent" r="58" cx="60" cy="60"/>
							</svg>
							
							<img src="https://dofustouch.cdn.ankama.com/assets/2.37.3_*UpeckluU6zqk8,shazO*oz2B4PEe0Wc/gfx/jobs/${job.icon}.png">
							
						</div>
						
						<div class='jobStats'>
							<h2>${job.name}, level: ${job.level} (${percent.toFixed(2)}%)</h2>
							<div class='items'>
								${skillsHtml}
							</div>
						</div>
					</div>
				`
			}
			$("#jobs").html(jobHtml);
			break;
			
			
		case "LOGS":
			$("#data>div").html(data.logs);
			$("#data").scrollTop($("#data").prop("scrollHeight"));
			break;
			
		case "CONFIG":
			$("#character").attr("value", data.config.autoSelectCharacter ? ""  : data.config.character)
			if(!data.config.autoSelectServer){
				$("#connectionServer").find(`[value='${data.config.server}']`).attr("selected", true)
			}
			
			$("#channelsFilter").children().each((i, el)=>{
				$(el).find("input").attr("checked", data.config.enabledChannels.includes(parseInt($(el).find("input").val())) ? true : false)
			})
			
			if(proxyRegex.test(data.config.proxy.proxyString)){
				const match = data.config.proxy.proxyString.match(proxyRegex)
				$("#proxyIp").attr("value", match[3])
				$("#proxyPort").attr("value", match[4])
				$("#proxyUser").attr("value", match[1])
				$("#proxyPass").attr("value", match[2])
			} else {
				$("#proxyIp").attr("value", "")
				$("#proxyPort").attr("value", "")
				$("#proxyUser").attr("value", "")
				$("#proxyPass").attr("value", "")
			}
				
			$("#proxyOn").attr("checked", data.config.proxy.enabled);
			$("#proxyOff").attr("checked", !data.config.proxy.enabled);
				
			$("#exchangePass").attr("value", data.config.exchange.pass);
			$("#exchangeOn").attr("checked", data.config.exchange.enabled);
			$("#exchangeOff").attr("checked", !data.config.exchange.enabled);
			
			$("#speedhack").attr("checked", data.config.speedhack);
			$("#bank").attr("value", data.config.bank);
			$("#minLP").attr("value", data.config.minLP);
			$("#antimod").attr("checked", data.config.antimod);
			$("#auto").attr("checked", data.fightConfig.auto)
			$("#berserker").attr("checked", data.fightConfig.berserker)
			$("#maxDistance").attr("value", data.fightConfig.maxDistance)
			$("#skipTurn").attr("checked", data.fightConfig.skipTurn)
			$(".m>#debug").attr("checked", data.fightConfig.debug)
			$(".nm>#debug").attr("checked", data.fightConfig.debug)
			
			$(".manual").find("input, button, submit, textarea, select").attr("disabled", data.fightConfig.auto);
			$("#instructions").find("input, button, submit, textarea, select").attr("disabled", data.fightConfig.auto);
			$(".manual").css("cursor", data.fightConfig.auto ? "not-allowed" : "default");
			$(".manual").css("opacity", data.fightConfig.auto ? 0.5 : 1);
			$(".manual").find(".radio").css("cursor", data.fightConfig.auto ? "not-allowed" : "pointer");
			$(".instr").css("cursor", data.fightConfig.auto ? "not-allowed" : "default");
			$(".instr").css("opacity", data.fightConfig.auto ? 0.5 : 1);
			if(data.fightConfig.auto){
				$("#spellsFight").find(".spell").addClass("addSpellDisabled");
				$("#spellsFight").find(".spell").removeClass("selected");
				$(".manual").find(".checkmark").addClass("disabled");
			} else {
				$("#spellsFight").find(".spell").removeClass("addSpellDisabled");
				$("#spellsFight").children().first().addClass("selected")
				$(".manual").find(".checkmark").removeClass("disabled");
			}
			break;
		
			
		case "SAUCE_READY":
			// $("#loading").css("display", "none")
			// $("#container").css("display", "block")
			if($(".toggleMenu").children("i").attr("class") == "fa fa-chevron-left") toggleMenu(".toggleMenu")
			break;
		
		case "PARTIES":
			for(const e in data){
				const party = data[e]
				initParty(party.leader, party.slaves, party.partyId)
			}
			break;
	}
};

$('form').on('submit', function(e){
    e.preventDefault()
})

function login(user){
	$(".login").attr("disabled", true);
	sendToMain("LOGIN", {
		user
	})
}

function importBulk(bulk){
	const accounts = bulk.replace(/\r\n/g, "\r").replace(/\n/g, "\r").split(/\r/)
	for(const account of accounts){
		if(account.includes(":")){
			const combo = account.split(":")
			if(combo.length == 2) importAccount("", combo[0], combo[1])
			// else alert(`Le compte ${account} est invalide.`)
		} 
		// else alert(`Le compte ${account} est invalide.`)
	}
}
function importAccount(server, username, password){
	if(!username) username = $("#user").val() == "" ? null : $("#user").val()
	if(!password) password = $("#pass").val() == "" ? null : $("#pass").val()
	if(!username || !password) return;
	$(".import").attr("disabled", true);
	sendToMain("IMPORT", {
		username,
		password,
		"config": {
			"enabledChannels":[0, 5, 6, 7, 9],
			"proxy": {"proxyString": "", "enabled": false},
			"exchange": {"pass": "", "enabled": false},
			"speedhack": false,
			"bank": 80,
			"minLP": 80,
			"antimod": true,
			"autoSelectServer": false,
			server,
			"autoSelectCharacter": true,
			"character": "",
			"autoUpgradeCharac": {},
			"autoUpgradeSpells": {}
		},
		"fightConfig": {
			"auto": true,
			"spellsToUse": [],
			"berserker": false,
			"maxDistance": 12,
			"skipTurn": false,
			"debug": true,
			"instructions": {}
		}	

	})
}

function sendChat(username){
	$('#sendButton').attr("disabled", true); 
	sendToMain("SEND_CHAT", {username, content: $("#chat").val()})
	$('#sendButton').attr("disabled", false); 
}

function moveToSide(username, side){
	sendToMain("MOVE_SIDE", {username, side})
}

function loadScript(username, name, code, path){
	$("#scriptName").html("Chargement...");
	sendToMain("LOAD_SCRIPT", {username, name, code, path})
	$("#favDiv").css("display", "none")
}

function runScript(username){
	sendToMain("RUN_SCRIPT", {username})
}

function stopScript(username){
	sendToMain("STOP_SCRIPT", {username})
}

function moveItem(username, UID, position = "63"){
	sendToMain("MOVE_ITEM", {username, UID, position})
}
$('.add').on("click", (event)=>{
	// console.log($(event.target).html())
	const file = $(event.target).hasClass("addFile") || $(event.target).parent().hasClass("addFile")
	$(".accounts").children().removeClass("active");
	$("#container, #partyContainer").css("display", "none")
	$("#username").html("");
	$("input[name='partyCheckbox']:checked").attr("checked", false)
	$("#import").css("display", !file ? "block" : "none")
	$("#importFile").css("display", file ? "block" : "none")
})

function readScript(username){
	const script = document.getElementById("script").files[0];
	const fileReader = new FileReader();
	fileReader.addEventListener('load', fileLoadedEvent => {
		const code = fileLoadedEvent.target.result;
		loadScript(username, script.name, code, script.path)
	});
	
	fileReader.readAsText(script, "UTF-8");
};

function createCharacter(username, breed){
	sendToMain("CREATE_CHARACTER", {
		username,
		breed
	})
}
function cancelCharacterCreation(username){
	sendToMain("CANCEL_CHARACTER_CREATION", {
		username
	})
}

function saveConfig(username){
	var config = {enabledChannels: []}
	
	$("#channelsFilter").children().each((i, el)=>{
		if($(el).find("input").attr("checked") == "checked") config.enabledChannels.push(parseInt($(el).find("input").val()))
	})
	
	var proxyString = `${$("#proxyUser").val()}:${$("#proxyPass").val()}@${$("#proxyIp").val()}:${$("#proxyPort").val()}`
	if(proxyString.charAt(0) == ":" && proxyString.charAt(1) == "@" && !proxyRegex.test(proxyString)) proxyString = proxyString.slice(2)
	config["proxy"] = {proxyString, enabled: $("#proxyOn").attr("checked") == "checked"}

	config["exchange"] = {pass: $("#exchangePass").val(), enabled: $("#exchangeOn").attr("checked") == "checked"}
	config["bank"] = parseInt($("#bank").val());
	config["speedhack"] = $("#speedhack").attr("checked") == "checked";
	config["minLP"] = parseInt($("#minLP").val());
	config["antimod"] = $("#antimod").attr("checked") == "checked";
	
	if($("#connectionServer").val() == "auto"){
		config["autoSelectServer"] = true
		config["server"] = ""
	} else {
		config["autoSelectServer"] = false
		config["server"] = $("#connectionServer").val()
	}
	if($("#character").val() == ""){
		config["autoSelectCharacter"] = true
		config["character"] = ""
	} else {
		config["autoSelectCharacter"] = false
		config["character"] = $("#character").val()
	}
	
	sendToMain("SAVE_CONFIG", {
		username,
		config
	})
		
}

function saveConfigFight(username, refresh = true){
	const debug = $(".m").css("display") != "none" ? $(".m>#debug") : $(".nm>#debug")
	const config = {
		auto: $("#auto").attr("checked") == "checked",
		spellsToUse: [],
		berserker: $("#berserker").attr("checked") == "checked",
		maxDistance: Math.abs(parseInt($("#maxDistance").val())),
		skipTurn: $("#skipTurn").attr("checked") == "checked",
		debug: debug.attr("checked") == "checked",
	}
	
	console.log(config)
	sendToMain("SAVE_FIGHTER_CONFIG", {
		username,
		config
	})
	
	if(refresh){
		$("#auto").attr("checked", config.auto)
		$("#berserker").attr("checked",config.berserker)
		$("#maxDistance").attr("value", config.maxDistance)
		$("#skipTurn").attr("checked", config.skipTurn)
		$("#debug").attr("checked", config.debug)
		
		
		$(".manual").find("input, button, submit, textarea, select").attr("disabled", config.auto);
		$("#instructions").find("input, button, submit, textarea, select").attr("disabled", config.auto);
		$(".manual").css("cursor", config.auto ? "not-allowed" : "default");
		$(".manual").css("opacity", config.auto ? 0.5 : 1);
		$(".manual").find(".radio").css("cursor", config.auto ? "not-allowed" : "pointer");
		$(".instr").css("cursor", config.auto ? "not-allowed" : "default");
		$(".instr").css("opacity", config.auto ? 0.5 : 1);
		if(config.auto){
			$("#spellsFight").find(".spell").addClass("addSpellDisabled");
			$("#spellsFight").find(".spell").removeClass("selected");
			$(".manual").find(".checkmark").addClass("disabled");
		} else {
			$("#spellsFight").find(".spell").removeClass("addSpellDisabled");
			$("#spellsFight").children().first().addClass("selected")
			$(".manual").find(".checkmark").removeClass("disabled");
		}
	}
}

function addInstruction(username, spellId = undefined, name = undefined, cacOnly = undefined, toCellId = undefined, toCellIdText = undefined, repeat = undefined, isNew = true){
	if(!spellId) spellId = parseInt($("#spellsFight>.selected").attr("id").split("spell")[1])
	if(!name) name = $("#spellsFight>.selected").attr("name");
	if(!cacOnly) cacOnly = $("#cacOnly").attr("checked") == "checked";
	if(!toCellId) toCellId = $("#toCellId").val();
	if(!toCellIdText) toCellIdText = $("#toCellId option:selected").text();
	if(!repeat && repeat != 0) repeat = Math.abs(parseInt($("#repeat").val()));
		
	var content = `<p id='instruction${$("#instructions>p").length}'><span class='info'>${name}</span>: <b>${repeat}x</b> sur `
	content += toCellIdText.includes("Soi-même") ? toCellIdText.toLowerCase() : "un " + toCellIdText.toLowerCase();
	if($("#cacOnly").attr("checked") == "checked") content += ", CAC seulement"
	// content += `. <button class='removeI' style='' onclick='removeInstruction("${username}", "${$("#instructions>p").length}")'></button></p>`
	content += `. <button class='removeI' style='' onclick='removeInstruction("${username}", $(this).parent().index(), "${$("#instructions>p").length}")'></button></p>`
	
	if(isNew){
		sendToMain("ADD_INSTRUCTION", {
			username,
			instruction: {
				spellId,
				name,
				cacOnly, 
				toCellId,
				toCellIdText,
				repeat
			}
		})
		// $("#instructions").append(content)
	}
	
	
	$("#instructions").append(content)
		
	if(isNew) saveConfigFight(username, false)
}

function removeInstruction(username, index, e){
	$("#instruction"+e).remove()
	sendToMain("REMOVE_INSTRUCTION", {
		username,
		index
	})
}


function autoUpgradeCharac(username, value){
	sendToMain("AUTO_UPGRADE", {username, carac: value})
}

function autoUpgradeSpells(username, spellId){
	const checkedElements = $("input[name='autoUpgradeSpells']:checked").length;
	// console.log(checkedElements)
	if($(`#autoUpgradeSpell${spellId}`).attr("checked") == "checked"){
		$(`#autoUpgradeSpell${spellId}`).siblings(".number").attr("id", checkedElements)
		
		// $("#spells").html($("#spells").html());
		$(`#autoUpgradeSpell${spellId}`).attr("checked", true)
		$(`#autoUpgradeSpell${spellId}`).siblings(".number").attr("id", checkedElements)
	}
	else{
		
		const start = parseInt($(`#autoUpgradeSpell${spellId}`).siblings(".number").attr("id")) + 1
		for(var i = start; i <= checkedElements + 1; i++){
			$(`.number[id='${i}']`).attr("id", i - 1)
			$(`.number[id='${i}']`).attr("id", i - 1)
		}
		// $("#spells").html($("#spells").html());
		$(`#autoUpgradeSpell${spellId}`).attr("checked", false)
	}
	
	var spells = [];
	$("input[name='autoUpgradeSpells']:checked").each((i, el) => {
		spells[parseInt($(el).siblings(".number").attr("id")) - 1] = parseInt($(el).attr("id").split("autoUpgradeSpell")[1])
	})
	
	sendToMain("AUTO_UPGRADE", {username, spells})
}

function openMenu(username, id, enabled, disabled){
	event.stopImmediatePropagation()
	if(!$("#contextMenu").html()) $("body").append("<div id='contextMenu'></div>");
	$("#contextMenu").html("")
	
	const name = $(`#${id}`).parent().attr("title");
	
	if(name) $("#contextMenu").append(`<span style='margin:0; padding:0;'><i>${name}</i></span>`)
	
	for(const skill of enabled){
		var html = ""
		if(skill[1]) html += `<div><input type='text' placeholder = 'Code' id = 'lock' onclick='event.stopImmediatePropagation()'>`
		html += `<button onclick='sendToMain("USE_INTERACTIVE", {username: "${username}", id: ${id}, skill: "${skill[0]}", lock: $(this).siblings("#lock").val()})'>${skill[0]}</button>`
		if(skill[1]) html += "</div>"
		
		$("#contextMenu").append(html)
	}
	for(const skill of disabled){
		var html = ""
		if(skill[1])html += `<div><input type='text' placeholder = 'Code' id = 'lock' disabled>`
		html += `<button disabled>${skill[0]}</button>`
		if(skill[1]) html += "</div>"
			
		$("#contextMenu").append(html)
	}
	
	$("#contextMenu").css("display", "block");
	$("#contextMenu").css("top",  (event.pageY+10) + 'px');
	$("#contextMenu").css("left", (event.pageX+10) + 'px');
	
	/*$(document).bind("click", function(event) {
		$("#contextMenu").css("display", "none");
		$(document).unbind("click");
	});*/
}

function connectAll(){
	const usernames = $(".accounts > a").map(function() {return this.id}).toArray();
	for(const username of usernames){
		if($(`#${username} #stateG`).html() == "Offline") login(username)
	}
}
function disconnectAll(){
	const usernames = $(".accounts > a").map(function() {return this.id}).toArray();
	for(const username of usernames){
		if($(`#${username} #stateG`).html() != "Offline") login(username)
	}
}
function startAll(){
	const usernames = $(".accounts > a").map(function() {return this.id}).toArray();
	for(const username of usernames){
		sendToMain("RUN_SCRIPT", {username})
	}
}
function stopAll(){
	const usernames = $(".accounts > a").map(function() {return this.id}).toArray();
	for(const username of usernames){
		sendToMain("STOP_SCRIPT", {username})
	}
}
function loadAll(){
	const script = document.getElementById("scriptRapid").files[0];
	const fileReader = new FileReader();
	fileReader.addEventListener('load', fileLoadedEvent => {
		const code = fileLoadedEvent.target.result;
		const usernames = $(".accounts > a").map(function() {return this.id}).toArray();
		for(const username of usernames){
			loadScript(username, script.name, code, script.path)
		}
	});
	
	fileReader.readAsText(script, "UTF-8");
}

function initPartyWindow(){
	const checkedElements = $("input[name='partyCheckbox']:checked").length;
	if(checkedElements == 0 || (checkedElements == 1 && $(".party").length == 0)){
		if($("#partyContainer").css("display") == "block") $('.add').first().click();
		return;
	}
	
	$(".accounts").children().removeClass("active");
	$("#container, #import, #importFile").css("display", "none")
	$('#username').html("")
	
	if(checkedElements == 1 && $(".party").length > 0){
		$("#memberToAdd").html($("input[name='partyCheckbox']:checked").parent().parent().attr("id"))
		$("#partyId").html("")
		$(".party").each((i, el)=>{
			const id = $(el).attr("id").split("party")[1];
			$("#partyId").append(`<option value='${id}'>${id}</option>`)
		})
		$("#partyContainer").css("display", "block")
		$("#addGroup").css("display", "none");
		$("#addMember").css("display", "block");
		return;
	}
	var leader = "";
	var slaves = [];
	$("input[name='partyCheckbox']:checked").each((i, el) => {
		if(i == 0) return leader = $(el).parent().parent().attr("id")
		slaves.push($(el).parent().parent().attr("id"))
	})
	
	$("#leader").html(leader)
	$("#slaves").html(slaves.join("<span style='color:var(--titles);'> - </span>"))
	$("#partyContainer").css("display", "block")
	$("#addGroup").css("display", "block");
	$("#addMember").css("display", "none");
}
function initParty(leader, slaves, id = null){
	var isNew = false
	if(!id){
		id = (((1+Math.random())*0x10000)|0).toString(16).substring(1)
		isNew = true;
	}
	const partyWrapper = $(`<div class='party' id='party${id}'></div>`)
	// $(".accounts>a[id='"+leader+"']").wrap(partyWrapper)
	
	for(const slave of [leader, ...slaves]){
		$(`.accounts>a[id='${slave}']>.radio`).css("display", "none")
		$(`.accounts>a[id='${slave}']>.radio>input`).attr("checked", false)
		$(`.accounts>a[id='${slave}']`).addClass(`member${id}`)
		if(slave != leader) $(`.accounts>a[id='${slave}']>div`).before(`<button class='kick' onclick='deleteMember("${id}", "${slave}")'><img src='./slots/kick.png'></button>`)
	}
	
	$(`.member${id}`).wrapAll(partyWrapper)
	$(`#party${id}`).prepend(`<div style='padding:10px;'><span>Party: ${id}</span><button class='removeI' onclick='purgeParty("${id}")'></button></div>`)
	
	if(isNew){
		sendToMain("INIT_PARTY", {
			leader,
			slaves,
			id
		})
		$(`#${leader}`).click()
	}
}
function deleteMember(id, username){
	if($('#'+username).parent().attr("id").includes('party')){
		if($('#'+username).siblings("a").length < 2) return purgeParty(id)
	}
	sendToMain("DELETE_PARTY_MEMBER", {
		username
	})
	$(".accounts").append($(`#${username}`))
	$(`#${username}>.radio`).css("display", "block")
	$(`#${username}`).removeClass(`member${id}`)
	$(`#${username}>.kick`).remove()
	
}
function addMember(id, username){
	sendToMain("ADD_PARTY_MEMBER", {
		id,
		username
	})
			
	$(`#party${id}`).append($(`#${username}`))
	$(`#${username}>.radio`).css("display", "none")
	$(`#${username}>.radio>input`).attr("checked", false)
	$(`#${username}`).addClass(`member${id}`)
	$(`#${username}>div`).before(`<button class='kick' onclick='deleteMember("${id}", "${username}")'><img src='./slots/kick.png'></button>`)
}
function purgeParty(id){
	console.log("purging", id)
	sendToMain("PURGE_PARTY", {
		id
	})
	$(`#party${id}>div`).remove()
	if($(`.member${id}`).length > 1) $(`.member${id}`).unwrap()
	else $(".accounts").append($(`.member${id}`))
	$(`.member${id}>.radio`).css("display", "block")
	$(`.member${id}>.kick`).remove()
	$(`.member${id}`).removeClass(`member${id}`)
}


function favoriteScripts(){
	if($("#scriptName").html() == "") return;
	
	if($("#fav").css("color") == "rgb(0, 128, 0)"){ //is added and we remove
		sendToMain('REMOVE_SCRIPT_FAV', $("#scriptName").html())
	} else if($("#fav").css("color") == "rgb(255, 0, 0)"){ //we add
		sendToMain('ADD_SCRIPT_FAV', $("#scriptName").html())
	}
}

function liveScript(code){
	sendToMain('LIVE_SCRIPT', {username: $("#username").html(), code})
}

var mapGrid = $(`
	<table class='mapContainer'></table>
`);
for(var i = 0; i <= 33; i++){
	mapGrid.append("<tr id='row" + i + "'></tr>")
	for(var j = 0; j <= 32; j++) mapGrid.find("#row" + i).append("<td title = '' class='cell' id='coords" + i + "_" + j + "' style='visibility:hidden;'></td>")

}

function getMapPointFromCellId(e) {
	var t = e % 14 - ~~(e / 28),
		i = t + 19,
		n = t + ~~(e / 14);
	return {
		x: i,
		y: n
	}
}

function constructMapPoints() {
	// var mapPointToCellId = {}
	for (var cellId = 0; cellId < 560; cellId++) {
		const coord = getMapPointFromCellId(cellId)
		
		mapGrid.find("#coords"+coord.y + "_" + coord.x).css("visibility","visible");
		mapGrid.find("#coords"+coord.y + "_" + coord.x).attr("class", "cell "+cellId);
		mapGrid.find("#coords"+coord.y + "_" + coord.x).attr("onclick", "sendToMain('MOVE_TO_CELL', {username: $('#username').html(), cell: "+cellId+"})");
		
		mapGrid.find("#coords"+coord.y + "_" + coord.x).attr("oncontextmenu", "showCellId('"+cellId+"'); return false;");
		
	}
	// return (mapPointToCellId)
	return mapGrid.html()
}

function showCellId(cellId){
	$('#cellid').html(cellId);
	$("#elid").html("-1")
	$('.cell.'+cellId).children().each((i, el) => {
		if($(el).attr("class").includes("interactive") || $(el).attr("class").includes("npc"))
			// console.log($(el).attr("id"))
			$("#elid").html($(el).attr("id"))
	})
}
const mapHtml = constructMapPoints()
delete mapGrid;
// var mapPointToCellId = constructMapPoints();

// Object.freeze(mapPointToCellId);