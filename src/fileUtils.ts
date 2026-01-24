/**
 * Saves a Blob to a file.
 *
 * @param blob - The Blob to save.
 * @param filename - Optional filename. If not provided, a default one will be generated in the 'output' directory.
 * @returns The absolute path of the saved file.
 */
export async function saveBlobToFile(
	blob: Blob,
	filename?: string,
): Promise<string> {
	let fs: typeof import("node:fs/promises");
	let path: typeof import("node:path");

	try {
		fs = (await import("node:fs/promises")).default;
		path = (await import("node:path")).default;
	} catch {
		throw new Error(
			"File system access is not available. .save() method is only supported in Node.js environments.",
		);
	}

	let targetPath: string;

	if (filename) {
		if (!filename.endsWith(".csv")) {
			throw new Error(`Filename must end with .csv: ${filename}`);
		}

		const ext = path.extname(filename);
		const expectedExt = blob.type === "application/json" ? ".json" : ".csv";
		if (ext !== expectedExt) {
			let detail = `Cannot save ${blob.type === "application/json" ? "JSON" : "CSV"} data as ${ext}`;
			if (blob.type === "application/json" && ext === ".csv") {
				detail += ". The blob appears to be JSON despite a CSV request.";
			}
			throw new Error(`Extension mismatch: ${detail}`);
		}
		targetPath = path.resolve(filename);
	} else {
		const now = new Date();
		const timestamp = now
			.toISOString()
			.replace(/[-T:.Z]/g, "")
			.slice(0, 14);
		const ms = String(now.getMilliseconds()).padStart(3, "0");
		const name = `${timestamp}_${ms}.csv`;

		const outputDir = path.resolve("output");
		try {
			await fs.access(outputDir);
		} catch {
			await fs.mkdir(outputDir, { recursive: true });
		}
		targetPath = path.join(outputDir, name);
	}

	const parentDir = path.dirname(targetPath);
	try {
		await fs.access(parentDir);
	} catch {
		await fs.mkdir(parentDir, { recursive: true });
	}

	try {
		await fs.access(targetPath);
		throw new Error(`Filename already exists: ${targetPath}`);
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
	}

	const arrayBuffer = await blob.arrayBuffer();
	await fs.writeFile(targetPath, Buffer.from(arrayBuffer));

	return targetPath;
}
