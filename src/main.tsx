import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import App from "./App";

const rootElement = document.getElementById("root");
if (rootElement) {
	ReactDOM.createRoot(rootElement).render(
		<React.StrictMode>
			<HashRouter>
				<Routes>
					<Route path="/" element={<App />} />
					<Route path="/:filename" element={<App />} />
				</Routes>
			</HashRouter>
		</React.StrictMode>,
	);
}
