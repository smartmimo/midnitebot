const serverDisconnecting = require("./messages/connection/serverDisconnecting");
const HelloGameMessage = require("./messages/connection/HelloGameMessage");
const TrustStatusMessage = require("./messages/connection/TrustStatusMessage");
const SequenceNumberRequestMessage = require("./messages/connection/SequenceNumberRequestMessage");
const BasicLatencyStatsRequestMessage = require("./messages/connection/BasicLatencyStatsRequestMessage");
const GameContextCreateMessage = require("./messages/connection/GameContextCreateMessage");
const CurrentMapMessage = require("./messages/connection/CurrentMapMessage");
const AccountCapabilitiesMessage = require("./messages/connection/AccountCapabilitiesMessage");
const setShopDetailsSuccess = require("./messages/connection/setShopDetailsSuccess");
const SystemMessageDisplayMessage = require("./messages/connection/SystemMessageDisplayMessage");
const ConsoleMessage = require("./messages/connection/ConsoleMessage");

const CharactersListMessage = require("./messages/character/CharactersListMessage");
const CharacterSelectedSuccessMessage = require("./messages/character/CharacterSelectedSuccessMessage");
const GameContextRefreshEntityLookMessage = require("./messages/character/GameContextRefreshEntityLookMessage");
const CharacterLevelUpMessage = require("./messages/character/CharacterLevelUpMessage");
const CharacterStatsListMessage = require("./messages/character/CharacterStatsListMessage");
const CharacterSelectedForceMessage = require("./messages/character/CharacterSelectedForceMessage");
const LifePointsRegenBeginMessage = require("./messages/character/LifePointsRegenBeginMessage");
const GameRolePlayPlayerLifeStatusMessage = require("./messages/character/GameRolePlayPlayerLifeStatusMessage");

const InventoryContentMessage = require("./messages/inventory/InventoryContentMessage");
const InventoryWeightMessage = require("./messages/inventory/InventoryWeightMessage");
const ObjectMovementMessage = require("./messages/inventory/ObjectMovementMessage");
const ObjectModifiedMessage = require("./messages/inventory/ObjectModifiedMessage");
const ObjectQuantityMessage = require("./messages/inventory/ObjectQuantityMessage");
const ObjectDeletedMessage = require("./messages/inventory/ObjectDeletedMessage");
const ObjectAddedMessage = require("./messages/inventory/ObjectAddedMessage");
const KamasUpdateMessage = require("./messages/inventory/KamasUpdateMessage");
const ObjectErrorMessage = require("./messages/inventory/ObjectErrorMessage");
const ObjectsDeletedMessage = require("./messages/inventory/ObjectsDeletedMessage");
const ObjectsAddedMessage = require("./messages/inventory/ObjectsAddedMessage");

const SpellUpgradeSuccessMessage = require("./messages/spells/SpellUpgradeSuccessMessage")
const SpellListMessage = require("./messages/spells/SpellListMessage");

const JobExperienceMultiUpdateMessage = require("./messages/jobs/JobExperienceMultiUpdateMessage");
const JobDescriptionMessage = require("./messages/jobs/JobDescriptionMessage");
const JobUnlearntMessage = require("./messages/jobs/JobUnlearntMessage");
const JobExperienceUpdateMessage = require("./messages/jobs/JobExperienceUpdateMessage");
const JobLevelUpMessage = require("./messages/jobs/JobLevelUpMessage");

module.exports = [
	serverDisconnecting,
	HelloGameMessage,
	TrustStatusMessage,
	SequenceNumberRequestMessage,
	BasicLatencyStatsRequestMessage,
	GameContextCreateMessage,
	CurrentMapMessage,
	AccountCapabilitiesMessage,
	setShopDetailsSuccess,
	SystemMessageDisplayMessage,
	ConsoleMessage,
	
	CharactersListMessage,
	CharacterSelectedSuccessMessage,
	CharacterStatsListMessage,
	GameContextRefreshEntityLookMessage,
	CharacterLevelUpMessage,
	CharacterSelectedForceMessage,
	LifePointsRegenBeginMessage,
	GameRolePlayPlayerLifeStatusMessage,
	
	InventoryContentMessage,
	InventoryWeightMessage,
	ObjectMovementMessage,
	ObjectModifiedMessage,
	ObjectQuantityMessage,
	ObjectDeletedMessage,
	ObjectAddedMessage,
	KamasUpdateMessage,
	ObjectErrorMessage,
	ObjectsDeletedMessage,
	ObjectsAddedMessage,
	
	SpellListMessage,
	SpellUpgradeSuccessMessage,
	
	JobExperienceMultiUpdateMessage,
	JobDescriptionMessage,
	JobUnlearntMessage,
	JobExperienceUpdateMessage,
	JobLevelUpMessage
];

