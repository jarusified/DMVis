import "@fontsource/roboto";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { applyMiddleware, createStore } from "redux";
import thunkMiddleware from "redux-thunk";

import Dashboard from "./Dashboard";
import EnsembleDashboard from "./EnsembleDashboard";
import "./main.css";
import Reducer from "./reducer";

const store = createStore(Reducer, applyMiddleware(thunkMiddleware));

// Adjust the color theme here.
const theme = createTheme({
	palette: {
		primary: {
			light: "#0066ff",
			main: "#0044ff",
			contrastText: "#ffcc00"
		},
		secondary: {
			light: "#0066ff",
			main: "#0044ff",
			contrastText: "#ffcc00"
		},
		background: "#fff",
		backgroundHighlight: "#f8f8f8",
		gpuUtilization: "#69BF71",
		cpuUtilization: "#F86045"
	},
	text: {
		fontSize: 12,
		fontSizeSmall: 10,
		highlight: "#04ACB5",
		label: "#007CBE",
		black: "#000",
		white: "#fff"
	}
});

function App() {
	useEffect(() => {
		document.title = "DMVis";
	}, []);
	return (
		<Provider store={store}>
			<Router>
				<Routes>
					<Route path="/dashboard" element={<DashboardWrapper />} />
					<Route path="/" element={<EnsembleDashboardWrapper />} />
				</Routes>
			</Router>
		</Provider>
	);
}

function DashboardWrapper() {
	return (
		<ThemeProvider theme={theme}>
			<Dashboard />
		</ThemeProvider>
	);
}

function EnsembleDashboardWrapper() {
	return (
		<ThemeProvider theme={theme}>
			<EnsembleDashboard />
		</ThemeProvider>
	);
}

export default App;
