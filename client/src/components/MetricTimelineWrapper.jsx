import { useTheme } from "@emotion/react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import * as d3 from "d3";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchMetricTimelineByWindow } from "../actions";
import D3LineGraph from "../ui/d3-line-graph";

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

	const [filteredMetrics, setFilteredMetrics] = useState([]);

	const style = {
		top: 0,
		right: 10,
		bottom: 10,
		left: 100,
		width: window.innerWidth * 0.66 - 30,
		height: 50,
		fontSize: theme.text.fontSizeSmall
	};

	useEffect(() => {
		if (
			selectedExperiment !== "" &&
			timelineStart != 0 &&
			timelineEnd != 0
		) {
			dispatch(fetchMetricTimelineByWindow(windowStart, windowEnd));
		}
	}, [selectedExperiment, timelineStart, timelineEnd]);

	useEffect(() => {
		if (Object.keys(metricTimeline).length > 0) {
			d3.select("#metric-timeline-view").selectAll("*").remove();
			let container = document.getElementById("metric-timeline-view");

			const filtered_metrics = Object.keys(metricTimeline).filter(
				(d) => d != "timestamp"
			);
			setFilteredMetrics(filtered_metrics);
		}
	}, [metricTimeline]);

	useEffect(() => {
		if (windowStart != 0 && windowEnd != 0) {
			console.log("Fetching data for window: ", timelineStart, "-", timelineStart + sectorWidth);
			dispatch(fetchMetricTimelineByWindow(windowStart, windowEnd));
		}
	}, [windowStart])

	return (
		<Paper sx={{ maxHeight: 250, overflow: "auto" }}>
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
						({Object.keys(metricTimeline).length} metrics)
					</span>
				</Typography>
			</Grid>
			<Grid container p={1}>
				{filteredMetrics.map((metric) => (
					<Grid item key={metric}>
						<D3LineGraph
							containerName={metric + "timeline-view"}
							yData={metricTimeline[metric]}
							xData={metricTimeline["timestamp"]}
							style={style}
							xProp={metric}
						/>
					</Grid>
				))}
			</Grid>
		</Paper>
	);
}

export default MetricTimelineWrapper;
