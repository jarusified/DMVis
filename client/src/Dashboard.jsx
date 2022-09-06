import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Grid, CssBaseline } from "@mui/material";

import ToolBar from "./components/ToolBar";
import MetadataWrapper from "./components/MetadataWrapper";
import TimelineWrapper from "./components/TimelineWrapper";
import SummaryTimelineWrapper from "./components/SummaryTimelineWrapper";

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
					<Grid container m={1} spacing={1}>
						<Grid item>
							<TimelineWrapper />
						</Grid>
						<Grid item>
							<SummaryTimelineWrapper />
						</Grid>
						<Grid item>
							<Grid item xs={6}>
							</Grid>
							<Grid item>
								<MetadataWrapper />
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</main>
		</div>
	);
}
