import { Grid, Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as d3 from "d3";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchSummary, updateWindow } from "../actions";
import { COLORS, formatDuration, formatTimestamp } from "../helpers/utils";

const useStyles = makeStyles((theme) => ({
	summary: {
		width: window.innerWidth - 20
	}
}));

function SummaryTimelineWrapper() {
	const classes = useStyles();
	const dispatch = useDispatch();

	const selectedExperiment = useSelector((store) => store.selectedExperiment);
	const summary = useSelector((store) => store.summary);
	const timelineEnd = useSelector((store) => store.timelineEnd);
	const timelineStart = useSelector((store) => store.timelineStart);
	const windowEnd = useSelector((store) => store.windowEnd);
	const windowStart = useSelector((store) => store.windowStart);

	const svgRef = useRef(undefined);
	const brushRef = useRef(undefined);

	useEffect(() => {
		if (selectedExperiment !== "") {
			const barWidth = 30;
			const sampleCount = Math.floor(width / barWidth);
			dispatch(fetchSummary(sampleCount));
		}
	}, [selectedExperiment]);

	const margin = { top: 30, right: 20, bottom: 10, left: 40 };
	const svgWidth = window.innerWidth;
	const width = window.innerWidth - margin.left - margin.right;
	const svgHeight = 150;
	const height = svgHeight - margin.bottom - margin.top;
	const containerID = "summary-view"

	useEffect(() => {
		d3.select("#" + containerID).selectAll("*").remove();

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
			let x = d3
				.scaleBand()
				.domain(samples)
				.range([0, width])
				.padding(0.1);

			let y = d3.scaleLinear().domain([0, max_ts]).range([height, 0]);

			let xAxis = d3
				.axisBottom()
				.scale(x)
				.ticks(5)
				.tickFormat((d) => formatDuration(d, start_ts, false));

			let yAxis = d3
				.axisLeft()
				.scale(y)
				.ticks(3)
				.tickFormat((d) => formatTimestamp(d));

			// Brush interaction
			// https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/30
			brushRef.current = d3
				.brushX()
				.extent([
					[0, x.range()[0]],
					[width, x.range()[1]]
				])
				.on("start brush", handleBrush);

			function handleBrush(e) {
				let brushExtent = e.selection || x.range();
				let _ts = _extent_to_timestamp(brushExtent);
				console.debug("Brush extent (on selection): ", brushExtent);
				dispatch(
					updateWindow(timelineStart + _ts[0], timelineStart + _ts[1])
				);
			}

			function _extent_to_timestamp(brushExtent) {
				/*
				Convert brush extent to timestamp.
				*/
				const factor = (timelineEnd - timelineStart) / width;
				return [factor * brushExtent[0], factor * brushExtent[1]];
			}

			svgRef.current = d3
				.select("#" + containerID)
				.append("svg")
				.attr("width", svgWidth)
				.attr("height", svgHeight)
				.append("g")
				.attr(
					"transform",
					"translate(" + margin.left + "," + margin.top + ")"
				);

			svgRef.current
				.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + -margin.top + ")")
				.call(xAxis)
				.selectAll("text")
				.style("text-anchor", "end")
				.attr("dx", ".8em");

			svgRef.current
				.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 0)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text("%");

			// Stacked bar chart
			const stackedData = d3.stack().keys(groups)(bars);

			function to_perc(val, width) {
				return (val / width) * 100;
			}

			const stacked = svgRef.current
				.append("g")
				.attr("class", "stacked_bar_chart")
				.selectAll("g");

			stacked
				.data(stackedData)
				.enter()
				.append("g")
				.attr("fill", function (d) {
					const class_name = class_names[d.key];
					return COLORS[class_name];
				})
				.selectAll("rect")
				.data(function (d) {
					return d;
				})
				.enter()
				.append("rect")
				.attr("x", function (d) {
					return x(d.data.ts);
				})
				.attr("y", function (d) {
					return y(d[1]);
				})
				.attr("height", function (d) {
					return (
						y(d[0]) - y(d[1])
					);
				})
				.attr("width", x.bandwidth());
		}
	}, [summary]);

	useEffect(() => {
		if (summary.samples.length > 0 && windowStart != 0 && windowEnd != 0) {
			const samples = summary.samples;

			let x = d3.scaleBand().domain(samples).range([0, width]);

			let start_bin = x.domain().reduce((prev, curr) => {
				return Math.abs(curr - windowStart) <
					Math.abs(prev - windowStart)
					? curr
					: prev;
			});

			let end_bin = x.domain().reduce((prev, curr) => {
				console.debug(curr - windowEnd, prev - windowEnd);
				return Math.abs(curr - windowEnd) < Math.abs(prev - windowEnd)
					? curr
					: prev;
			});

			if (svgRef.current != undefined && brushRef != undefined) {
				svgRef.current
					.call(brushRef.current)
					.call(brushRef.current.move, [x(start_bin), x(end_bin)]);
			}
		}
	}, [windowStart, windowEnd]);

	return (
		<Paper>
			<Grid container>
				<Grid item>
					<div id={containerID}></div>
				</Grid>
			</Grid>
		</Paper>
	);
}

export default SummaryTimelineWrapper;
