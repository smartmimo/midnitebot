const got = require("got")
const key = "ad77f4cab5646aa841a0e3c8eb47aca9b792ba76"

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

got.post("http://localhost:8080/signup", {
        body: new URLSearchParams({
            username: "yayasqsqsq",
            password: "betatester",
            repassword: "betatester",
            email: "el.attaoui.mohamed@gmail.com"
        }).toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then(d => {
        console.log(d.body)
    })
    /*
    keepAlive = 1;
    got.post("http://localhost:8080/loginwkey", {
    	body: "key="+e(key, "ajitchofwahdzab"),
    	headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).then(d=>{
    	const response = JSON.parse(e(d.body, key))
    	got.post("http://localhost:8080/yesimthisinsecurehh", {
    		body: "whyusnoofingaround=" + e(JSON.stringify(response.user), "ajitchofwahdzab"),
    		headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    	}).then(da=>{
    		if(e(da.body, keepAlive+key+keepAlive) == 'slm 3tw mmkn bote mrc') console.log("ok")
    		else console.log(e(da.body, key))
    	})
    	
    	setInterval(()=>{
    		got.post("http://localhost:8080/keepalive", {
    			body: "whyusnoofingaround=" + e(JSON.stringify({...response.user, keepAlive: true}), "ajitchofwahdzab"),
    			headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    		}).then(da=>{
    			keepAlive++
    			if(e(da.body, keepAlive+key+keepAlive) == 'slm 3tw mmkn bote mrc') console.log("ok")
    			else console.log(e(da.body, key))
    		})
    	}, 10000)
    }).catch(err=>{
    	if(err.response && err.response.body) err.message = e(err.response.body, key)
    	console.log(err.message)
    })*/