const childProcess = require("child_process")
const readline = require("readline")
const fs = require("fs")
const path = require("path")
const request = require("request")
const targz = require("targz")
const Zip = require("adm-zip")
const chmodr = require("chmodr")

const platform = process.platform;

const OSDownloadList = [
	
];

function supportPlatform() {
	return new Promise(resolve => {
		fs.access(`${__dirname}/bin/${platform}`, error =>
			error ? resolve(false) : resolve(true)
		);
	});
}

function chooseOSType() {
	return new Promise((resolve, reject) => {
		switch (platform) {
			case "aix":
				console.log(
					"We are very sorry, your current OS is not supported by MongoDB"
				);
				process.exit();
				break;
			case "win32":
				downloadMongoDB(OSDownloadList[0]).then(resolve);
				break;
			case "darwin":
				downloadMongoDB(OSDownloadList[1]).then(resolve);
				break;
			default:
				var rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout
				});
				rl.question(
					`Veuillez choisir quelle version à télécharger:\n${OSDownloadList
						.map((version, index) => `${index + 1}. ${version}`)
						.join("\n")}\n`,
					answer => {
						if (OSDownloadList[answer - 1]) {
							downloadMongoDB(OSDownloadList[answer - 1])
								.then(resolve)
								.catch(reject);
						} else {
							console.log(answer + " is not a valid asnwer");
							chooseOSType();
						}
						rl.close();
					}
				);
		}
	});
}

function setupMongoDirectory(decompressPath) {
	return new Promise((resolve, reject) => {
		const mongoBinDirectory = path.join(decompressPath, "bin");
		const dbPath = path.join(__dirname, "data");

		if (!fs.existsSync(dbPath)) {
			fs.mkdirSync(dbPath);
		}
		fs.readdir(mongoBinDirectory, (error, mongoBinFiles) => {
			if (error) {
				return reject(error);
			}
			let i = 0;
			for (const file of mongoBinFiles) {
				fs.rename(
					path.join(mongoBinDirectory, file),
					path.join(path.dirname(decompressPath), file),
					error => {
						i++;
						if (error) {
							return reject(error);
						}
						if (i == mongoBinFiles.length) {
							resolve();
						}
					}
				);
			}
		});
	});
}

function decompressMongoDBFile(filePath) {
	return new Promise((resolve, reject) => {
		const extension = path.extname(filePath);
		const unzipPath = path.dirname(filePath);
		console.log("Extracting MongoDB files...");

		switch (extension) {
			case ".tgz":
				targz.decompress(
					{
						src: filePath,
						dest: unzipPath
					},
					error =>
						error
							? reject(error)
							: resolve(filePath.replace(extension, ""))
				);
				break;
			case ".zip":
				var zip = new Zip(filePath);
				zip.extractAllToAsync(unzipPath, false);
				chmodr(filePath, 0o777, error =>
					error
						? reject(error)
						: resolve(filePath.replace(extension, ""))
				);
				break;
		}
	});
}

function downloadMongoDB(pathname) {
	const pathnameDirectory = pathname.split("/");
	const dirname = path.join(__dirname, "bin", platform);
	const filename = pathnameDirectory[1];
	const filePath = path.join(dirname, filename);

	return new Promise((resolve, reject) => {
		if (!fs.existsSync(dirname)) {
			fs.mkdirSync(dirname);
		}
		const file = fs.createWriteStream(filePath);
		const req = request.get(OSDownloadListBaseUrl + pathname);

		req.on("response", response => {
			if (response.statusCode !== 200) {
				const errorMessage = "Request error " + response.statusCode;
				return reject(errorMessage);
			}
			const fileSize = Math.floor(
				response.headers["content-length"] / 1000000
			); // MB
			console.log(
				`(${fileSize} MB) Downloading file in Services/mongoServer/${filename} ...`
			);
			req.pipe(file);
		});
		req.on("error", error => {
			fs.unlink(filePath, () => {});
			return reject(error.message);
		});
		file.on("finish", async () => {
			console.log("Done downloading Services/mongoServer/" + filename);
			file.close();
			const decompressPath = await decompressMongoDBFile(filePath);
			await setupMongoDirectory(decompressPath);
			fs.unlink(filePath, () => {});
			fs.unlink(decompressPath, () => {});
			resolve();
		});
		file.on("error", error => {
			fs.unlink(filePath, () => {});
			return reject(error.message);
		});
	});
}

async function run() {
	if ((await supportPlatform(platform)) === false) {
		// Proceed to download MongoDB
		try {
			await chooseOSType();
			console.log("MongoDB successfully installed");
		} catch (error) {
			return Promise.reject(error);
		}
	}
	return new Promise((resolve, reject) => {
		console.log(
			`\x1b[44m Service \x1b[0m MongoDB - \x1b[35mInitialising...\x1b[0m`
		);
		const serverStartFileName = fs
			.readdirSync(path.join(__dirname, `/bin/${platform}/`))
			.find(name => name.includes("mongod") && !name.includes("mdmp"));

		const server = childProcess.spawn(
			`${__dirname}/bin/${platform}/${serverStartFileName}`,
			["--dbpath", path.join(__dirname, "/data")]
		);
		server.stdout.on("data", data => {
			if (
				data.includes("NETWORK") &&
				data.includes("waiting for connections on port")
			) {
				resolve();
			}
		});
		server.stderr.on("data", data => reject(new Error(data)));
		server.on("close", code => {
			reject(new Error(`child process exited with code ${code}`));
		});
		server.on("exit", code => {
			reject(new Error(`child process exited with code ${code}`));
		});
	});
}

run()
