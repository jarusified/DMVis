import { makeStyles } from "@material-ui/core/styles";
import { CssBaseline, Grid } from "@mui/material";
import React from "react";

import DetailedTabWrapper from "./components/DetailedTabWrapper";
import SummaryTimelineWrapper from "./components/SummaryTimelineWrapper";
import TimelineWrapper from "./components/TimelineWrapper";
import TopologyWrapper from "./components/TopologyWrapper";
import ToolBar from "./components/ToolBar";

const useStyles = makeStyles((theme) => ({
	root: {
		flexGrow: 1
	},
	paper: {
		textAlign: "center",
		color: theme.palette.text.secondary
	},
	content: {
		flexGrow: 1,
		height: "100vh",
		overflow: "auto"
	},
	appBarSpacer: theme.mixins.toolbar
}));

export default function Dashboard() {
	const classes = useStyles();

	return (
		<Grid className={classes.root}>
			<CssBaseline />
			<ToolBar />

			<main className={classes.content}>
				<div className={classes.appBarSpacer} />
				<Grid mt={1} mb={1}>
					<Grid container>
						<Grid item xs={12} p={1}>
							<TimelineWrapper />
						</Grid>
						<Grid item xs={12} p={1}>
							<SummaryTimelineWrapper />
						</Grid>
						<Grid item xs={6} p={1}>
							<DetailedTabWrapper />
						</Grid>
						<Grid item xs={6} p={1}>
							<TopologyWrapper />
						</Grid>
					</Grid>
				</Grid>
			</main>
		</Grid>
	);
}
