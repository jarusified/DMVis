import { CssBaseline, Grid } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

import EnsembleSummaryWrapper from "./components/EnsembleSummaryWrapper";
import ToolBar from "./ui/ToolBar";
import DraggableDialog from "./ui/folder-input-dialog";

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
	const isLoaded = useSelector((store) => store.isLoaded);

	return (
		<Grid className={classes.root}>
			<CssBaseline />
			<ToolBar withDropdown={false} />
			{isLoaded ? (
				<main className={classes.content}>
					<div className={classes.appBarSpacer} />
					<EnsembleSummaryWrapper />
				</main>
			) : (
				<DraggableDialog />
			)}
		</Grid>
	);
}
