import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, CssBaseline } from "@mui/material";

import ToolBar from "./components/ToolBar";
import TimelineWrapper from "./components/TimelineWrapper"

const useStyles = makeStyles((theme) => ({
	root: {
		display: "flex",
	},
	paper: {
		textAlign: "center",
		color: theme.palette.text.secondary,
	},
	content: {
		flexGrow: 1,
		height: "100vh",
		overflow: "auto",
	},
	appBarSpacer: theme.mixins.toolbar,
}));

export default function Dashboard() {
	const classes = useStyles();

	return (
		<div className={classes.root}>
			<CssBaseline />
			<ToolBar />

			<main className={classes.content}>
				<div className={classes.appBarSpacer} />
				<Grid>
					<Grid container spacing={1} m={1}>
						<Grid item xs={12}>
							<JITTimelineWrapper />
						</Grid>
					</Grid>
				</Grid>
			</main>
		</div>
	);
}
