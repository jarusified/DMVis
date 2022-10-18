import { CssBaseline, Grid } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import React from "react";

import EnsembleSummaryWrapper from "./components/EnsembleSummaryWrapper";
import ToolBar from "./ui/ToolBar";

const useStyles = makeStyles((theme) => ({
	root: {
		flexGrow: 1
	},
	content: {
		flexGrow: 1,
		height: "100vh",
		overflow: "auto"
	},
	appBarSpacer: theme.mixins.toolbar
}));

export default function EnsembleDashboard() {
	const classes = useStyles();

	return (
		<Grid className={classes.root}>
			<CssBaseline />
			<ToolBar />

			<main className={classes.content}>
				<div className={classes.appBarSpacer} />
				<EnsembleSummaryWrapper />
			</main>
		</Grid>
	);
}
