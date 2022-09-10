import * as d3 from "d3";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchBackgroundSummary } from "../actions";
import { COLORS, durToSec } from "../helpers/utils";

export default function BackgroundSummaryWrapper() {
	const dispatch = useDispatch();

	const backgroundSummary = useSelector((store) => store.backgroundSummary);
	const selectedExperiment = useSelector((store) => store.selectedExperiment);

	const margin = { top: 10, right: 20, bottom: 10, left: 20 };
	const containerWidth = window.innerWidth / 2;
	const containerHeight = window.innerHeight / 5;
	const width = containerWidth - margin.left - margin.right;
	const height = containerHeight - margin.bottom - margin.top;
	const containerID = "#background-summary-view";

	useEffect(() => {
		if (selectedExperiment !== "") {
			dispatch(fetchBackgroundSummary());
		}
	}, [selectedExperiment]);

	useEffect(() => {
		d3.select(containerID).selectAll("*").remove();
		if (backgroundSummary != undefined && backgroundSummary.length > 0) {
			const events = backgroundSummary.map((bar) => bar.event);
			const durations = backgroundSummary.map((bar) => bar.dur);

			let x = d3
				.scaleBand()
				.domain(events)
				.range([0, width])
				.padding(0.2);
			let y = d3
				.scaleLinear()
				.domain([0, d3.max(durations)])
				.range([height, 0]);

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
				.tickFormat((d) => durToSec(d) + "s");

			let svg = d3
				.select(containerID)
				.append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr(
					"transform",
					"translate(" + margin.left + "," + -margin.bottom + ")"
				);

			svg.selectAll("bars")
				.data(backgroundSummary)
				.enter()
				.append("rect")
				.attr("x", (d) => {
					return x(d.event);
				})
				.attr("y", (d) => {
					return y(d.dur);
				})
				.attr("width", x.bandwidth())
				.attr("height", (d) => {
					return height - y(d.dur);
				})
				.attr("fill", (d) => {
					return COLORS[d.group];
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
				.attr("dx", "3em")
				.attr("transform", "rotate(-90)")
				.attr("y", 10)
				.style("text-anchor", "end");
		}
	}, [backgroundSummary]);
	return <div id="background-summary-view"></div>;
}
