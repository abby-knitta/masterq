import { useEffect, useState } from "react";
import { useDuckDb } from "duckdb-wasm-kit";
import { useParams } from "react-router-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const App: React.FC = () => {
	const { db } = useDuckDb();
	const [queryResult, setQueryResult] = useState<any[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [initialized, setInitialized] = useState(false);
	const { filename } = useParams<{ filename: string }>();

	const editor = useEditor({
		extensions: [StarterKit],
		content: `
      SELECT * FROM ${filename || "data"};
    `,
	});

	useEffect(() => {
		async function initializeDatabase() {
			if (db) {
				try {
					const c = await db.connect();

					const filePath = filename
						? `/masterq/${filename}.json`
						: "/masterq/data.json"; // パスが指定されていない場合は data.json を使用する

					const streamResponse = await fetch(filePath);

					if (!streamResponse.ok) {
						throw new Error("Network response was not ok");
					}

					const buffer = new Uint8Array(await streamResponse.arrayBuffer());
					const tableName = filename ? filename : "data"; // テーブル名を動的に設定
					await db.registerFileBuffer(`${tableName}.json`, buffer);
					await c.insertJSONFromPath(`${tableName}.json`, { name: tableName });

					await c.close();
					setInitialized(true);
				} catch (err) {
					if (err instanceof Error) {
						setError(err.message);
					} else {
						setError("An unknown error occurred");
					}
				}
			}
		}

		initializeDatabase();
	}, [db, filename]);

	const runQueries = async (query: string) => {
		if (db && query) {
			try {
				const c = await db.connect();

				const arrowResult = await c.query(query);
				const jsonResult = arrowResult.toArray().map((row) => row.toJSON());
				setQueryResult(jsonResult);
				setError(null);

				await c.close();
			} catch (err) {
				if (err instanceof Error) {
					setError(err.message);
				} else {
					setError("An unknown error occurred");
				}
			}
		}
	};

	useEffect(() => {
		// 初期クエリを実行
		if (initialized) {
			const tableName = filename ? filename : "data"; // テーブル名を動的に設定
			runQueries(`SELECT * FROM ${tableName};`);
		}
	}, [initialized, filename]);

	const handleRunQuery = () => {
		if (editor) {
			const query = editor.getText();
			runQueries(query);
		}
	};

	return (
		<div>
			<EditorContent editor={editor} />
			<button onClick={handleRunQuery}>Run Query</button>
			{error && (
				<div style={{ color: "red" }}>
					<h3>Error:</h3>
					<pre>{error}</pre>
				</div>
			)}
			{queryResult.length > 0 && (
				<div>
					<h3>Query Result:</h3>
					<pre>{JSON.stringify(queryResult, null, 2)}</pre>
				</div>
			)}
		</div>
	);
};

export default App;
