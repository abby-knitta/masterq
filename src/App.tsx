import { useEffect, useState, useCallback, useMemo } from "react";
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
		content: "",
	});

	const [registeredTables, setRegisteredTables] = useState<Set<string>>(
		new Set(),
	);

	const isTableRegistered = useMemo(() => {
		return (tableName: string) => registeredTables.has(tableName);
	}, [registeredTables]);

	useEffect(() => {
		const initializeAndRunQuery = async () => {
			if (db && editor) {
				try {
					const c = await db.connect();
					const tableName = filename ? filename : "data";

					if (!isTableRegistered(tableName)) {
						// テーブルが存在しない場合のみ、JSONファイルを読み込んでテーブルを作成
						const filePath = filename
							? `/masterq/${filename}.json`
							: "/masterq/data.json";
						console.log(`Fetching data from: ${filePath}`);
						const streamResponse = await fetch(filePath);
						if (!streamResponse.ok) {
							throw new Error("Network response was not ok");
						}
						const buffer = new Uint8Array(await streamResponse.arrayBuffer());
						await db.registerFileBuffer(`${tableName}.json`, buffer);
						await c.insertJSONFromPath(`${tableName}.json`, {
							name: tableName,
						});

						setRegisteredTables(new Set(registeredTables.add(tableName)));
					}

					// クエリを実行
					const query = `SELECT * FROM ${tableName};`;
					const arrowResult = await c.query(query);
					const jsonResult = arrowResult.toArray().map((row) => row.toJSON());
					setQueryResult(jsonResult);
					setError(null);

					// エディターの内容を更新
					editor.commands.setContent(query);

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
		};

		initializeAndRunQuery();
	}, [db, filename, editor, isTableRegistered]);

	const runQueries = useCallback(
		async (query: string) => {
			if (db && query && initialized) {
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
		},
		[db, initialized],
	);

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
