import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import App from "./App";

const rootElement = document.getElementById("root");
if (rootElement) {
	ReactDOM.createRoot(rootElement).render(
		<React.StrictMode>
			<BrowserRouter basename="/masterq">
				<Routes>
					<Route path="/" element={<App />} />
					<Route path="/:filename" element={<App />} />
				</Routes>
			</BrowserRouter>
		</React.StrictMode>,
	);
}
