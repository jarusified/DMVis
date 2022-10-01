import "@fontsource/roboto";
import { MuiThemeProvider, createTheme } from "@material-ui/core/styles";
import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { applyMiddleware, createStore } from "redux";
import thunkMiddleware from "redux-thunk";

import Dashboard from "./Dashboard";
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
		background: {
			paper: "#FFFFFF"
		}
	},
	text: {
		primary: {
			main: "#fff"
		},
		secondary: {
			main: "#000"
		}
	}
});

function App() {
	useEffect(() => {
		document.title = "NOVA-VIS";
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
