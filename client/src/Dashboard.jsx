import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, CssBaseline } from "@mui/material";

import ToolBar from "./components/ToolBar";
import MetadataWrapper from "./components/MetadataWrapper";
import TimelineWrapper from "./components/TimelineWrapper";
import SummaryTimelineWrapper from "./components/SummaryTimelineWrapper";
import DetailedTabWrapper from "./components/DetailedTabWrapper";

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
					<Grid container m={1} rowSpacing={1}>
						<Grid item xs={12}>
							<TimelineWrapper />
						</Grid>
						<Grid item xs={12}>
							<SummaryTimelineWrapper />
						</Grid>
						<Grid item xs={6}>
							<DetailedTabWrapper />
						</Grid>
						<Grid item xs={6}>
							<MetadataWrapper />
						</Grid>
					</Grid>
				</Grid>
			</main>
		</div>
	);
}
