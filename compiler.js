const fs = require("fs")
const path = require("path")
const obf = require('javascript-obfuscator');
var UglifyJS = require("uglify-js");
const got = require("got")

/**Constants**/
const allAssets = [
    'breeds.json',
    'spells.json',
    'chat.json',
    'items.json',
    'effects.json',
    'monsters.json',
    'alwaysChooseSpells.json',
    'elementsEffects.json',
    'mapPositions.json',
    'subAreas.json',
    'npcs.json',
    'words.json',
    'nouns.json',
    'verbs.json',
    'characterDefaultCosmetics.json',
    'costSteps.json',
    'jobs.json',
    'skillToItem.json',
    'spellLevels.json'
]
const blacklisted = ["node_modules", "accounts", "scripts", "test", "Assets", "slots", "dist"]
const blacklistedFiles = ["package.json", "package-lock.json", "compiler.js", "sample.json"]

const obfBlacklist = ["jquery.min.js", "scriptLoader.js"]
const regex = /^(.*)require\((.*)\)(.*)/

function e(str, encryptionPass) {
    var result = '';
    for (var i = 0; i < str.length; i++) {
        var c = "";
        l = 8;

        while (l--) c += (str[i].charCodeAt(0) >> l) & 1;

        var p = "";
        l = 8;
        while (l--) p += (encryptionPass[i % encryptionPass.length].charCodeAt(0) >> l) & 1;

        var r = '';
        for (var j = 0; j < 8; j++) {
            r += (parseInt(c[j]) + parseInt(p[j])) % 2;
        }
        result += String.fromCharCode(parseInt(r, 2));
    }

    return result;
}


function getDir(dir) {
    const list = fs.readdirSync(dir)
    var files = [];
    var folders = [];
    list.forEach(function(file) {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file)
        if (stat && stat.isDirectory()) folders.push(file)
        else files.push(file)
    })

    return { files, folders }
}

async function madmadenEncrypt(str, pass) {
    const res = await got.post("http://lywa.ddns.net:8080/midnitebetaacess/9alwa.php", {
        body: new URLSearchParams({
            key: "ajitchofzabikikber",
            a: "e",
            s: str,
            p: pass
        }).toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    return res.body;
}

/**
 * START
 **/
var folders = ["./"]
    // var assets = [];

while (folders.length > 0) {
    newFolders = [];
    for (const dir of folders) {
        if (blacklisted.filter(e => dir.includes(e)).length) continue;
        const all = getDir(dir);
        newFolders = [].concat(all.folders, newFolders)

        const files = all.files;

        /**
         * Processing every single file (obfuscation and replacement of asset names)
         **/
        for (const file of files) {
            if (blacklistedFiles.includes(path.basename(file))) continue;
            var code = fs.readFileSync(file, "utf8")

            //Adding encryption function to main.js
            /*if(path.basename(file) == "main.js"){
            	code = `global["p"] = (str, encryptionPass) => {
            			var result = '';
            			for (var i = 0; i < str.length; i++) {
            				var c = "";
            					l = 8;
            					
            				while(l--) c += (str[i].charCodeAt(0) >> l ) & 1;
            				
            				var p = "";
            					l = 8;
            				while(l--) p += (encryptionPass[i%encryptionPass.length].charCodeAt(0) >> l ) & 1;

            				var r = '';
            				for (var j = 0; j < 8; j++){
            					r += (parseInt(c[j]) + parseInt(p[j]))%2;
            				}
            				result += String.fromCharCode(parseInt(r, 2));
            			}	

            			return result;
            		}
            	` + code;
            }*/

            //Checking if it requires an asset and replace it with ${index}.madmaden
            const lines = code.split("\n");
            for (const line of lines) {
                if (line.includes("Assets/")) {
                    const match = line.match(regex)
                    if (match) {
                        const assetName = path.basename(match[2].replaceAll("'", "").replaceAll('"', ""))
                        const newName = allAssets.indexOf(assetName) + ".madmaden";
                        console.log(`\x1b[31m [REPLACE]: \x1b[32m${(file)}\x1b[0m: ${assetName} => ${newName}`)

                        code = code.replaceAll(`require(${match[2]})`, `JSON.parse(p(require('fs').readFileSync('./src/Assets/${newName}', 'utf8'), 'zabi666'))`)
                        code = code.replaceAll(assetName, newName)
                            // if(!assets.includes(assetName)) assets.push(assetName)
                    } else console.log(`\x1b[32m${(file)}\x1b[0m: ${line}`)
                }
            }

            //Check if is eligible for obfuscation
            if (path.extname(file) == ".js" && !obfBlacklist.includes(path.basename(file))) {
                console.log(`\x1b[33m [OBFUSCATE] \x1b[32m${path.basename(file)}\x1b[0m`)

                var options = {
                    toplevel: true,
                    output: {
                        beautify: false
                    },
                    warnings: true
                };
                // code = UglifyJS.minify(code, options).code;
                code = obf.obfuscate(code).getObfuscatedCode()
                if (path.basename(file) == "main.js") code = "console.log('Chargement... Ceci peut prendre un peu de temps, veuillez patienter.\\n\\n'); " + code;
            }

            //Write to Prod.
            if (!fs.existsSync(dir.replace("headless", "prod"))) fs.mkdirSync(dir.replace("headless", "prod"), { recursive: true });
            fs.writeFileSync(file.replace("headless", "prod"), code)
        }
        // console.log("----------------")
    }
    folders = newFolders;
}

/**
 * ASSET ENCRYPTION
 **/
if (!fs.existsSync("../prod/src/Assets")) fs.mkdirSync("../prod/src/Assets", { recursive: true });
(async() => {
    for (const asset of allAssets) {
        const source = fs.readFileSync("./src/Assets/" + asset, "utf8");

        //encryption
        console.log(`\x1b[35m [ENCRYPT] \x1b[32m${asset} > ${allAssets.indexOf(asset)+".madmaden"} (${allAssets.length})\x1b[0m`)
        try {
            // const res = await madmadenEncrypt(source, "aspirinezab666")
            const res = e(source, "zabi666")
            if (res != "nn") fs.writeFileSync("../prod/src/Assets/" + allAssets.indexOf(asset) + ".madmaden", res)
            else console.log(`\x1b[32m [ERROR] \x1b[32m${asset}\x1b[0m`)
        } catch (e) {
            console.log(`\x1b[32m [ERROR] \x1b[32m${asset}\x1b[0m: ${e.message}`)
        }
    }
})()

/*if(!fs.existsSync("../prod/src/Assets/maps")) fs.mkdirSync("../prod/src/Assets/maps", { recursive: true });
const maps = getDir("./src/Assets/maps").files
for(const map of maps){
	const source = fs.readFileSync(map);
	
	//encryption
	console.log(`\x1b[34m [MAP] \x1b[32m${map}\x1b[0m`)
	
	fs.writeFileSync(map.replace("headless", "prod"), source, ()=>{})
}*/

console.log("\n\n-------------------------------------\nDON'T FORGET TO UPDATE THE VERSION!!\n-------------------------------------")