import { CssBaseline, Grid } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import React from "react";

import HardwareTabWrapper from "./components/HardwareTabWrapper";
import ApplicationTabWrapper from "./components/ApplicationTabWrapper";
import CommunicationTabWrapper from "./components/CommunicationTabWrapper";
import SummaryTimelineWrapper from "./components/SummaryTimelineWrapper";
import TimelineWrapper from "./components/TimelineWrapper";
import ToolBar from "./ui/ToolBar";

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
						<Grid item xs={4} p={1}>
							<HardwareTabWrapper />
						</Grid>
						<Grid item xs={4} p={1}>
							<ApplicationTabWrapper />
						</Grid>
						<Grid item xs={4} p={1}>
							<CommunicationTabWrapper />
						</Grid>
					</Grid>
					<Grid>
						<Grid item xs={4} p={1}>

						</Grid>
						<Grid item xs={8} p={1}>
							<TimelineWrapper />
							<SummaryTimelineWrapper />
						</Grid>
					</Grid>
				</Grid>

			</main>
		</Grid>
	);
}
