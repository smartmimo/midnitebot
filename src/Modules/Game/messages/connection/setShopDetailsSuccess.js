function setShopDetailsSuccess(payload){
	payload.socket.send("shopHighLightsListRequest", {
			type: "POPUP"
	})
}

module.exports = setShopDetailsSuccess;