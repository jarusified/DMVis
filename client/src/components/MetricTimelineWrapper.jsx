import { useTheme } from "@emotion/react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";

import { makeStyles } from "@mui/styles";
import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Typography from "@mui/material/Typography";
import "vis-timeline/dist/vis-timeline-graph2d.css";

import { fetchTimeline, fetchWindow, updateWindow } from "../actions";
import { formatDuration, micro_to_milli } from "../helpers/utils";

const useStyles = makeStyles((theme) => ({
	timeline: {
		width: window.innerWidth * 0.66 - 10
	}
}));

function MetricTimelineWrapper() {
    const theme = useTheme();
	const classes = useStyles();
	const dispatch = useDispatch();

	const metricTimeline = useSelector((store) => store.metricTimeline);
	const selectedExperiment = useSelector((store) => store.selectedExperiment);
	const timelineEnd = useSelector((store) => store.timelineEnd);
	const timelineStart = useSelector((store) => store.timelineStart);
	const windowEnd = useSelector((store) => store.windowEnd);
	const windowStart = useSelector((store) => store.windowStart);
	const summary = useSelector((store) => store.summary);

	useEffect(() => {
		if (
			selectedExperiment !== "" &&
			timelineStart != 0 &&
			timelineEnd != 0
		) {
			// dispatch(fetchMetric(timelineStart, timelineStart));
		}
	}, [selectedExperiment, timelineStart, timelineEnd]);

	useEffect(() => {
		d3.select("#metric-timeline-view").selectAll("*").remove();
		let container = document.getElementById("metric-timeline-view");

		
		// Interaction: Fit the timeline to the screenWidth.
		document.getElementById("fit-button").onclick = function () {

		};

		// console.log("Fetching data for window: ", timelineStart, "-", timelineStart + sectorWidth);
		// dispatch(fetchWindow(timelineStart, timelineStart + sectorWidth));
	}, [metricTimeline]);

	
	return (
		<Paper>
            <Grid item xs={4} p={1}>
				<Typography
					variant="overline"
					style={{
						margin: 10,
						fontWeight: "bold",
						fontSize: theme.text.fontSize
					}}
				>
					Metric Timeline {"  "}
                    <span style={{ color: theme.text.label }}>
                        ({metricTimeline.length} metrics)
                    </span>
				</Typography>
			</Grid>
            <Grid container p={1}>
				<Grid item>
					<div id="metric-timeline-view" className={classes.timeline}></div>
				</Grid>
			</Grid>
		</Paper>
	);
}

export default MetricTimelineWrapper;
