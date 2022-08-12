import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";

import { Grid, Paper, Typography } from "@material-ui/core";
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import { makeStyles } from "@material-ui/core/styles";
import { Timeline } from "vis-timeline";
import { DataSet } from "vis-data";
import "vis-timeline/dist/vis-timeline-graph2d.css";

import { fetchTimeline } from "../actions";

const useStyles = makeStyles((theme) => ({
	timeline: {
		width: window.innerWidth - 20,
		height: 350,
	},
}));

function TimelineWrapper() {
	const classes = useStyles();
	const dispatch = useDispatch();

	const [isStacked, setIsStacked] = useState(false);

	const endTimestamp = useSelector((store) => store.endTimestamp);
	const selectedExperiment = useSelector((store) => store.selected_experiment);
	const startTimestamp = useSelector((store) => store.startTimestamp);
	const timeline = useSelector((store) => store.timeline);

	useEffect(() => {
		if (selectedExperiment !== "") {
			dispatch(fetchTimeline(selectedExperiment));
		}
	}, [selectedExperiment]);


	useEffect(() => {
		d3.select("#timeline-view").selectAll("*").remove();
		let container = document.getElementById("timeline-view");
		let items = new DataSet(timeline);

		// Configuration for the Timeline
		const options = {
			autoResize: false,
			
			format: {
				minorLabels: function (date, scale, step) {
					const duration = moment.duration(date.diff(startTimestamp));
					switch (scale) {
						case 'millisecond':
							return duration.asMilliseconds() + "ms";
						case 'second':
							return Math.floor(duration.asSeconds()) + "s";
						case 'minute':
							return Math.floor(duration.asMinutes()) + "min";
					}
				}
			},
			height: '350px',
			max: endTimestamp,
			min: startTimestamp,
			moment: function (date) {
				return moment(date);
			},
			orientation: 'top',
			stack: isStacked
		};

		// Create a Timeline
		let tx = new Timeline(container, items, options);
		document.getElementById("fit-button").onclick = function () {
			tx.fit();
		};

	}, [timeline, isStacked]);
	return (
		<Paper>
			<Typography variant="overline" style={{ fontWeight: "bold" }}>
				JIT Perf Timeline
			</Typography>
			<Grid container>
				<Button id="fit-button" variant="outlined">Fit</Button>
				<ToggleButton value="check" selected={isStacked} onChange={() => { setIsStacked(!isStacked); }}>
					Stack
				</ToggleButton>
				<Grid item>
					<div id="timeline-view" className={classes.timeline}></div>
				</Grid>
			</Grid>
		</Paper>
	);
}

export default TimelineWrapper;
