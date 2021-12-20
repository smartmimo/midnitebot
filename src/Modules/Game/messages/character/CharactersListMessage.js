const logger = require("../../../../Libs/Logger.js");

const breedNames = require("../../../../Assets/breeds.json");
const defaultCharacterCosmetics = require("../../../../Assets/characterDefaultCosmetics.json");

const creationErrors = {
    4: "Max character slots achieved"
}


module.exports = function CharactersListMessage(payload) {
    const { socket, data } = payload;
    const characters = data.characters;
    const username = socket.account.username;
    const account = accounts[username];

    const deleteCharacter = (id) => {
        const secretAnswerHash = require("crypto").createHash("md5").update(id + "~000000000000000000").digest("hex");
        socket.sendMessage("CharacterDeletionRequestMessage", {
            characterId: id,
            secretAnswerHash
        })
    }

    setState(username, "SELECTING CHARACTER");

    if (account.state != "CREATING CHARACTER" && configs[username].createCharacter) {
        setState(username, "CREATING CHARACTER");

        const breed = configs[username].createCharacter.breed;

        socket.eventEmitter.once("CharacterNameSuggestionFailureMessage", (payload) => {
            console.log(payload.data)
        })
        socket.sendMessage("CharacterNameSuggestionRequestMessage")

        socket.eventEmitter.once("CharacterNameSuggestionSuccessMessage", (payload) => {
            const name = payload.data.suggestion
            logger.info(`[${username}]: CHARACTER | Creating new character: ${name}`)
            sendToBrowser("LOG", { username, html: `<p class='warn'>Création d'un ${breedNames[breed]} sur ${account.auth.selectedServer.name}..</p>` })
            socket.sendMessage("CharacterCreationRequestMessage", {
                name,
                breed,
                sex: true,
                ...defaultCharacterCosmetics[breed]
            })


            socket.eventEmitter.once("CharacterCreationResultMessage", (payload) => {
                delete global.configs[username]["createCharacter"];
                sendToBrowser("CREATE_CHARACTER_CONFIRM", {
                    username
                })
                if (payload.data.result == 0) {
                    logger.warn(`[CHARACTER] Character ${name} created successfully.`)
                    sendToBrowser("LOG", { username, html: `<p class='success'>Personnage crée. Nom: ${name}, classe: ${breedNames[breed]}.</p>` })
                    accounts[username].extra["selectedCharacter"] = {
                        id: -1,
                        breed,
                        characterName: name,
                        level: 1,
                        sex: true
                    }


                    sendToBrowser("CREATE_CHARACTER_CONFIRM", {
                        username
                    })
                } else {
                    sendToBrowser("LOG", { username, html: `<p class='error'>Erreur lors de la création du personnage ${name}: ${creationErrors[payload.data.result] || payload.data.result}</p>` })
                    if (payload.data.result == 4) sendToBrowser("LOG", { username, html: `<p class='warn'>La fonctionalité de supprimer un personnage par nom sera disponible prochainement.</p>` })
                }
            })
        })
        return;
    }


    const accountConfig = configs[username];
    let selectedCharacter;
    let characterNamesStr = "";

    if (characters.length == 0) {
        sendToBrowser("LOG", { username, html: `<p class='error'>Aucun personnage disponible.</p>` })
        return;
    }

    for (let charIndex = 0; charIndex < characters.length; charIndex++) {
        if (characters[charIndex].name.toLowerCase() === accountConfig.character.toLowerCase().trim().replace(" ", "")) {
            selectedCharacter = characters[charIndex];
        }
        characterNamesStr += `<br><span style='color:white; margin-left:100px;'>${characters[charIndex].name} (${breedNames[characters[charIndex].breed]}): ${characters[charIndex].level}.</span>`
    }

    if (accountConfig.autoSelectCharacter) selectedCharacter = characters[0];

    sendToBrowser("LOG", { username, html: `<p class='info' style='line-height:normal;'>Les personnages disponibles: ${characterNamesStr}</p>` })

    if (!selectedCharacter) {

        sendToBrowser("LOG", { username, html: `<p class='error'>Le personnage <span style='color:white;'>${accountConfig.character}</span> est introuvable.</p>` })
        return;
    }

    setState(username, "INITIATING GAME");

    socket.sendMessage("CharacterSelectionMessage", {
        id: selectedCharacter.id
    });
}