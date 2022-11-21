import { useTheme } from "@emotion/react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";

import { makeStyles } from "@mui/styles";
import * as d3 from "d3";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Typography from "@mui/material/Typography";

import { fetchMetricTimeline } from "../actions";
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

	const style = {
		top: 0,
		right: 10,
		bottom: 0,
		left: 100,
		width: window.innerWidth * 0.66 - 30,
		height: 50
	};

	useEffect(() => {
		if (
			selectedExperiment !== "" &&
			timelineStart != 0 &&
			timelineEnd != 0
		) {
			dispatch(fetchMetricTimeline());
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
		<Paper sx={{maxHeight: 160, overflow: 'auto' }}>
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
				{Object.keys(metricTimeline).map((metric) => (
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
