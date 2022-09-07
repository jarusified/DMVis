import React, { useEffect } from "react";
import { MuiThemeProvider, createTheme } from "@material-ui/core/styles";
import "fontsource-roboto";

import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import thunkMiddleware from "redux-thunk";

import Reducer from "./reducer";
import "./main.css";
import Dashboard from "./Dashboard";

const store = createStore(Reducer, applyMiddleware(thunkMiddleware));

// Adjust the color theme here.
const theme = createTheme({
	palette: {
		primary: {
			light: '#0066ff',
			main: '#0044ff',
			contrastText: '#ffcc00',
		},
		secondary: {
			light: '#0066ff',
			main: '#0044ff',
			contrastText: '#ffcc00',
		},
		background: {
			paper: "#FFFFFF",
		},
	},
	text: {
		primary: {
			main: '#fff',
		},
		secondary: {
			main: '#000',
		}
	}
});

function App() {
	useEffect(() => {
		document.title = "JIT Profiler Visualization";
	}, []);
	return (
		<Provider store={store}>
			<Router>
				<Routes>
					<Route path="/" element={<DashboardWrapper />} />
				</Routes>
			</Router>
		</Provider>
	);
}

function DashboardWrapper() {
	return (
		<MuiThemeProvider theme={theme}>
			<Dashboard />
		</MuiThemeProvider>
	);
}

export default App;
