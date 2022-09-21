import * as d3 from "d3";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchEventSummary } from "../actions";
import { COLORS, formatTimestamp } from "../helpers/utils";

function EventSummaryWrapper() {
	const dispatch = useDispatch();

	const currentEventSummary = useSelector(
		(store) => store.currentEventSummary
	);
	const selectedExperiment = useSelector((store) => store.selectedExperiment);

	const margin = { top: 10, right: 20, bottom: 10, left: 20 };
	const containerWidth = window.innerWidth / 2;
	const containerHeight = window.innerHeight / 4;
	const width = containerWidth - margin.left - margin.right;
	const height = containerHeight - margin.bottom - margin.top;
	const containerID = "#event-summary-view";

	useEffect(() => {
		if (selectedExperiment !== "") {
			dispatch(fetchEventSummary());
		}
	}, [selectedExperiment]);

	useEffect(() => {
		d3.select(containerID).selectAll("*").remove();
		if (
			currentEventSummary != undefined &&
			currentEventSummary.length > 0
		) {
			const events = currentEventSummary.map((bar) => bar.event);
			const durations = currentEventSummary.map((bar) => bar.dur);

			let x = d3
				.scaleBand()
				.domain(events)
				.range([0, width])
				.padding(0.2);

			let y = d3
				.scaleLinear()
				.domain([d3.min(durations), d3.max(durations)])
				.range([height, 0])
				.nice(5);

			let xAxis = d3
				.axisBottom()
				.scale(x)
				.ticks(10)
				.tickPadding(-x.bandwidth() / 2)
				.tickSizeOuter(2)
				.tickFormat((d) => d);

			let yAxis = d3
				.axisLeft()
				.scale(y)
				.ticks(5)
				.tickFormat((d) => formatTimestamp(d));

			let svg = d3
				.select(containerID)
				.append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr(
					"transform",
					"translate(" + 2 * margin.left + "," + -margin.bottom + ")"
				);

			svg.selectAll("bars")
				.data(currentEventSummary)
				.enter()
				.append("rect")
				.attr("x", (d) => {
					return x(d.event);
				})
				.attr("y", (d) => {
					return y(d.dur);
				})
				.attr("class", (d) => {
					return d.class_name;
				})
				.attr("width", x.bandwidth())
				.attr("height", (d) => {
					return height - y(d.dur);
				})
				.attr("fill", (d) => {
					return COLORS[d.class_name];
				});

			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis)
				.selectAll("text")
				.attr("dy", x.bandwidth() / 2)
				.attr("dx", -3)
				.style("text-anchor", "end")
				.attr("transform", "rotate(90)");

			svg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
				.attr("transform", "rotate(-90)")
				.attr("y", 0)
				.attr("dy", "1em")
				.style("text-anchor", "end")
				.text("time (s))");
		}
	}, [currentEventSummary]);
	return <div id="event-summary-view"></div>;
}

export default EventSummaryWrapper;
