import { Grid, Paper } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import * as d3 from "d3";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchSummary, fetchTimeline } from "../actions";
import { COLORS, msTimestampToSec } from "../helpers/utils";

const useStyles = makeStyles((theme) => ({
	summary: {
		width: window.innerWidth - 20
	}
}));

function SummaryTimelineWrapper() {
	const classes = useStyles();
	const dispatch = useDispatch();

	const selectedExperiment = useSelector((store) => store.selectedExperiment);
	const timelineEnd = useSelector((store) => store.timelineEnd);
	const timelineStart = useSelector((store) => store.timelineStart);
	const summary = useSelector((store) => store.summary);

	useEffect(() => {
		if (selectedExperiment !== "") {
			dispatch(fetchSummary(selectedExperiment));
		}
	}, [selectedExperiment]);

	const margin = { top: 30, right: 20, bottom: 10, left: 40 };
	const width = window.innerWidth - margin.left - margin.right;
	const height = 150 - margin.bottom - margin.top;

	useEffect(() => {
		d3.select("#summary-view").selectAll("*").remove();

		const bars = summary.data;
		const groups = summary.groups;
		const samples = summary.samples;
		const ts_width = summary.ts_width;
		const start_ts = summary.start_ts;
		const end_ts = summary.end_ts;
		const window = summary.window;

		if (Object.keys(bars).length > 0) {
			let x = d3
				.scaleBand()
				.domain(samples)
				.range([0, width])
				.padding(0.1);
			let y = d3
				.scaleLinear()
				.domain([0, 100])
				.range([height - margin.bottom, 0]);

			let xAxis = d3
				.axisBottom()
				.scale(x)
				.ticks(5)
				.tickFormat((d) => msTimestampToSec(d, start_ts) + "s");

			let yAxis = d3
				.axisLeft()
				.scale(y)
				.ticks(3)
				.tickFormat((d) => d);

			// Brush interaction
			let brushExtent;
			let brush = d3.brushX().on("start brush", handleBrush);

			function handleBrush(e) {
				brushExtent = e.selection;
				update();
			}

			function _extent_to_timestamp(brushExtent) {
				/*
                Convert brush extent to timestamp.
                */
				const factor = (end_ts - start_ts) / width;
				return [factor * brushExtent[0], factor * brushExtent[1]];
			}

			function update() {
				let _ts = _extent_to_timestamp(brushExtent);
				// dispatch(fetchTimeline(start_ts + _ts[0], start_ts + _ts[1]));

				d3.selectAll("rect").style("fill", function (d) {
					let inBrushExtent =
						brushExtent && d.ts >= _ts[0] && d.ts <= _ts[1];

					return inBrushExtent ? "red" : COLORS[d["name"]];
				});
			}

			let svg = d3
				.select("#summary-view")
				.append("svg")
				.attr("width", width + margin.left)
				.attr("height", height + margin.top)
				.append("g")
				.attr(
					"transform",
					"translate(" + margin.left + "," + margin.top + ")"
				);

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + -30 + ")")
				.call(xAxis)
				.selectAll("text")
				.style("text-anchor", "end")
				.attr("dx", ".8em");

			svg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 0)
				.attr("dy", ".71em")
				.style("text-anchor", "end")
				.text("%");

			// Stacked bar chart
			const color = d3
				.scaleOrdinal()
				.domain(groups)
				.range(["#bebada", "#8dd3c7", "#ffffb3", "#deebf7"]);
			const stackedData = d3.stack().keys(groups)(bars);

			function to_perc(val, width) {
				return (val / width) * 100;
			}

			const stacked = svg
				.append("g")
				.attr("class", "stacked_bar_chart")
				.selectAll("g");

			stacked
				.data(stackedData)
				.enter()
				.append("g")
				.attr("fill", function (d) {
					return color(d.key);
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
					return y(to_perc(d[1], ts_width));
				})
				.attr("height", function (d) {
					return (
						y(to_perc(d[0], ts_width)) - y(to_perc(d[1], ts_width))
					);
				})
				.attr("width", x.bandwidth());

			var closest = samples.reduce(function (prev, curr) {
				return Math.abs(curr - (start_ts + window)) <
					Math.abs(prev - (start_ts + window))
					? curr
					: prev;
			});

			svg.call(brush);
			// .call(brush.move, [0, x(closest)])
		}
	}, [summary]);
	return (
		<Paper>
			<Grid container>
				<Grid item>
					<div id="summary-view"></div>
				</Grid>
			</Grid>
		</Paper>
	);
}

export default SummaryTimelineWrapper;
