import React, { useEffect } from "react";
import * as d3 from "d3";
import { useDispatch, useSelector } from "react-redux";

import { Grid, Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { Timeline } from "vis-timeline";
import { DataSet } from "vis-data";
import "vis-timeline/dist/vis-timeline-graph2d.css";

import { fetchTimeline } from "../actions";

const useStyles = makeStyles((theme) => ({
	timeline: {
		width: window.innerWidth - 20,
		height: 250,
	},
}));

function TimelineWrapper() {
	const classes = useStyles();

	const dispatch = useDispatch();
	const selectedExperiment = useSelector((store) => store.selected_experiment);

	const timeline = useSelector((store) => store.timeline);
	useEffect(() => {
		if (selectedExperiment !== "") {
			dispatch(fetchTimeline(selectedExperiment));
		}
	}, [selectedExperiment]);
	

	useEffect(() => {
		d3.select("#timeline-view").selectAll("*").remove();
		let container = document.getElementById("timeline-view");

		console.log(timeline);
		let items = new DataSet(timeline);

		// Configuration for the Timeline
		const options = {};

		// Create a Timeline
		let tx = new Timeline(container, items, options);
	}, [timeline]);
	return (
		<Paper>
			<Typography variant="overline" style={{ fontWeight: "bold" }}>
				JIT Perf Timeline
			</Typography>
			<Grid container>
				<Grid item>
					<div id="timeline-view" className={classes.timeline}></div>
				</Grid>
			</Grid>
		</Paper>
	);
}

export default TimelineWrapper;
