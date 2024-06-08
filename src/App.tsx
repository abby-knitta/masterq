import { useEffect, useState } from "react";
import { useDuckDb } from "duckdb-wasm-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const App: React.FC = () => {
	const { db } = useDuckDb();
	const [queryResult, setQueryResult] = useState<any[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [initialized, setInitialized] = useState(false);

	const editor = useEditor({
		extensions: [StarterKit],
		content: `
      SELECT * FROM rows;
    `,
	});

	useEffect(() => {
		async function initializeDatabase() {
			if (db) {
				try {
					const c = await db.connect();

					const streamResponse = await fetch("/masterq/data.json");
					if (!streamResponse.ok) {
						throw new Error("Network response was not ok");
					}
					const buffer = new Uint8Array(await streamResponse.arrayBuffer());

					await db.registerFileBuffer("rows.json", buffer);
					await c.insertJSONFromPath("rows.json", { name: "rows" });

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
	}, [db]);

	const runQueries = async (query: string) => {
		if (db && query) {
			try {
				const c = await db.connect();
				// クエリを実行
				const arrowResult = await c.query(query);
				const jsonResult = arrowResult.toArray().map((row) => row.toJSON());
				setQueryResult(jsonResult);
				setError(null); // エラーをクリア
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
			runQueries("SELECT * FROM rows;");
		}
	}, [initialized]);

	const handleRunQuery = () => {
		if (editor) {
			const query = editor.getText(); // getHTML() を getText() に変更してクエリテキストを取得
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
