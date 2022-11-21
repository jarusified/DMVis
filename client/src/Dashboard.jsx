import { CssBaseline, Grid } from "@mui/material";
import makeStyles from "@mui/styles/makeStyles";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchMetadata } from "./actions";
import ApplicationTabWrapper from "./components/ApplicationTabWrapper";
import CommunicationTabWrapper from "./components/CommunicationTabWrapper";
import HardwareTabWrapper from "./components/HardwareTabWrapper";
import SingleSummaryWrapper from "./components/SingleSummaryWrapper";
import TimelineWrapper from "./components/TimelineWrapper";
import MetricTimelineWrapper from "./components/MetricTimelineWrapper";
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

export default function Dashboard() {
	const classes = useStyles();
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const selectedExperiment = useSelector((store) => store.selectedExperiment);

	useEffect(() => {
		if (selectedExperiment == "") {
			navigate("/");
		} else {
			dispatch(fetchMetadata(selectedExperiment));
		}
	}, [selectedExperiment]);

	return (
		<Grid className={classes.root}>
			<CssBaseline />
			<ToolBar withDropdown={true} />

			<main className={classes.content}>
				<div className={classes.appBarSpacer} />
				<Grid container justifyContent="center">
					<Grid item xs={4} p={1}>
						<SingleSummaryWrapper />
					</Grid>
					<Grid item xs={8} p={1}>
						<TimelineWrapper />
						<MetricTimelineWrapper />
					</Grid>
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
			</main>
		</Grid>
	);
}
