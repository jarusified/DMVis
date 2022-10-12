import { useTheme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";
import React, { useEffect, useRef } from "react";
import "react-medium-image-zoom/dist/styles.css";
import { useDispatch, useSelector } from "react-redux";

import { fetchSummary, updateWindow } from "../actions";
import D3RadialBarGraph from "../ui/d3-radial-bar-graph";

const useStyles = makeStyles((theme) => ({
	svg: {
		height: "300px",
		overflowY: "auto",
		overflowX: "hidden"
	}
}));

export default function EnsembleSummaryWrapper() {
	const classes = useStyles();
	const theme = useTheme();
	const dispatch = useDispatch();

	const style = {
		top: 30,
		right: 20,
		bottom: 10,
		left: 40,
		width: window.innerWidth / 4,
		height: window.innerHeight / 4
	};

	const containerID = useRef("event-summary-view");
	const selectedExperiment = useSelector((store) => store.selectedExperiment);
	const summary = useSelector((store) => store.summary);

	useEffect(() => {
		if (selectedExperiment !== "") {
			const barWidth = 50;
			const sampleCount = Math.floor(style.width / barWidth);
			console.log(sampleCount);
			dispatch(fetchSummary(sampleCount));
		}
	}, [selectedExperiment]);

	useEffect(() => {
		console.log(summary);
		const bars = summary.data;
		const groups = summary.groups;
		const samples = summary.samples;
		const class_names = summary.class_names;
		const ts_width = summary.ts_width;
		const start_ts = summary.start_ts;
		const end_ts = summary.end_ts;
		const window = summary.window;
		const max_ts = summary.max_ts;

		if (Object.keys(bars).length > 0) {
			D3RadialBarGraph(containerID.current, style, samples, bars, groups, max_ts, class_names, start_ts);
		}
	}, [summary]);

	return <div id={containerID.current}></div>;
}
