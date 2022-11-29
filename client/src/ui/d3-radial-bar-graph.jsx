import { useTheme } from "@emotion/react";
import * as d3 from "d3";
import { interpolateBlues } from "d3-scale-chromatic";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchWindow, updateAppState, updateWindow } from "../actions";
import {
	COLORS,
	formatDuration,
	formatMemory,
	setContrast
} from "../helpers/utils";

export default function D3RadialBarGraph(props) {
	let {
		style,
		containerName,
		ensembleSummary,
		individualSummary,
		innerRadius,
		outerRadius,
		withInnerCircle,
		withUtilization,
		withTicks,
		withLabels,
		withYAxis,
		withPlayFeature
	} = props;

	const { xData, yData, zData, maxY, classNames, startTs, endTs, dmv } =
		individualSummary;
	const [hover, setHover] = useState(false);
	const [currentSector, setCurrentSector] = useState(-1);

	const theme = useTheme();
	const dispatch = useDispatch();
	const appState = useSelector((store) => store.appState);
	const timelineEnd = useSelector((store) => store.timelineEnd);
	const timelineStart = useSelector((store) => store.timelineStart);
	const windowEnd = useSelector((store) => store.windowEnd);
	const windowStart = useSelector((store) => store.windowStart);

	// Play-pause feature
	const TAU = 2 * Math.PI;
	const ANIMATION_DUR = 2000;

	const svgRef = useRef(null);
	const playArcG = useRef(null);
	const windowArc = useRef(null);
	const timer = useRef(null);

	function play_pause_icon(appState) {
		if (!appState) {
			return "M5 -10v35l23-18z"; // play icon
		} else if (appState) {
			return "M6 24h4V5H6v14zm8-14v14h4V5h-4z"; // pause icon
		}
	}

	function timestamp_to_tau(ts) {
		return ((ts - timelineStart) / (timelineEnd - timelineStart)) * TAU;
	}

	function tau_to_timestamp(angle) {
		return (angle * (timelineEnd - timelineStart)) / TAU + timelineStart;
	}

	useEffect(() => {
		const containerID = "#" + containerName;
		d3.select(containerID).selectAll("*").remove();

		svgRef.current = d3
			.select(containerID)
			.append("svg")
			.attr("width", style.width)
			.attr("height", style.height)
			.attr(
				"viewBox",
				`${-style.width / 2} ${-style.height / 2} ${style.width} ${
					style.height
				}`
			)
			.style("font", "10px sans-serif")
			.on("click", (d) => {
				setHover((hover) => !hover);
			});

		let x = d3.scaleBand().range([0, TAU]).align(0).domain(xData);

		let y = d3
			.scaleRadial()
			.range([innerRadius, outerRadius])
			.domain([0, maxY]);

		const arc = d3
			.arc()
			.innerRadius((d) => y(d[0]))
			.outerRadius((d) => y(d[1]))
			.startAngle((d) => x(d.data.ts))
			.endAngle((d) => x(d.data.ts) + x.bandwidth())
			.padAngle(0.02)
			.padRadius(innerRadius);

		const stackedData = d3.stack().keys(zData)(yData);

		svgRef.current
			.append("g")
			.selectAll("g")
			.data(stackedData)
			.join("g")
			.attr("fill", (d) => {
				const class_name = classNames[d.key];
				return COLORS[class_name];
			})
			.selectAll("path")
			.data((d) => d)
			.join("path")
			.attr("class", "sector")
			.attr("id", (d, i) => "sector-" + i)
			.attr("d", arc);

		// Add labels
		let label = svgRef.current
			.append("g")
			.selectAll("g")
			.data(xData)
			.enter()
			.append("g")
			.attr("text-anchor", "middle")
			.attr("opacity", () => {
				if (withTicks) {
					return 1;
				} else {
					return 0;
				}
			})
			.attr("transform", (d) => {
				return (
					"rotate(" +
					((x(d) * 180) / Math.PI - 90) +
					")translate(" +
					innerRadius +
					",0)"
				);
			});

		label.append("line").attr("x2", -5).attr("stroke", "#000");

		label
			.append("text")
			.attr("opacity", () => {
				if (withLabels) {
					return 1;
				} else {
					return 0;
				}
			})
			.attr("transform", (d) => {
				return (x(d) + x.bandwidth() / 2 + Math.PI / 2) %
					(2 * Math.PI) <
					Math.PI
					? "rotate(90)translate(0,16)"
					: "rotate(-90)translate(0,-9)";
			})
			.text((d) => formatDuration(d, startTs, false));

		// Add secondary encoding.
		const this_duration = endTs - startTs;
		const ensemble_duration =
			ensembleSummary["runtime_range"][1] -
			ensembleSummary["runtime_range"][0];

		// If the difference between the max and min is 0, it means there is
		// only 1 run in the ensemble.
		if (ensemble_duration == 0) {
			withInnerCircle = false;
		}

		if (withInnerCircle) {
			const perc =
				((this_duration - ensembleSummary["runtime_range"][0]) /
					ensemble_duration) *
				100;
			const cScale = d3
				.scaleSequential()
				.interpolator(interpolateBlues)
				.domain([0, 100]);
			const runtime_color = cScale(perc);
			const runtime_color_contrast = setContrast(runtime_color);

			svgRef.current
				.append("circle")
				.attr("cx", "50%")
				.attr("cy", "50%")
				.attr("r", 40)
				.style("fill", cScale(perc))
				.attr("transform", () => {
					return (
						"translate(" +
						-style.width / 2 +
						"," +
						-style.height / 2 +
						")"
					);
				});

			svgRef.current
				.append("text")
				.attr("fill", runtime_color_contrast)
				.attr("font-size", 12)
				.attr("transform", () => {
					return "translate(" + -10 + "," + 0 + ")";
				})
				.text(formatDuration(endTs, startTs, true));

			svgRef.current
				.append("text")
				.attr("fill", runtime_color_contrast)
				.attr("font-size", 12)
				.attr("transform", () => {
					return "translate(" + -20 + "," + 15 + ")";
				})
				.text(formatMemory(dmv));
		}

		if (
			individualSummary["gpuUtilization"] == undefined ||
			individualSummary["memUtilization"] == undefined
		) {
			withUtilization = false;
		}

		if (withUtilization) {
			// let xScale = d3
			// 	.scaleLinear()
			// 	.range([0, 2 * Math.PI])
			// 	.domain([0, 100]);

			// let yScale = d3
			// 	.scaleRadial()
			// 	.range([-innerRadius, innerRadius])
			// 	.domain([0, individualSummary["gpuUtilization"].length]);

			const xScale = d3
				.scaleLinear()
				.range([0, innerRadius / 2])
				.domain([0, 100]);
			const yScale = d3
				.scaleLinear()
				.range([-innerRadius, innerRadius])
				.domain([0, individualSummary["gpuUtilization"].length]);

			const curve = d3
				.line()
				.x((d) => xScale(d))
				.y((d, i) => yScale(i));
			// const curve =  d3.arc()
			// 	.innerRadius((d, i) => yScale(i))
			// 	.startAngle((d) => x(d))
			// 	.endAngle((d) => x(d) + x.bandwidth())
			// 	.padAngle(0.01)
			// 	.padRadius(innerRadius)

			svgRef.current
				.append("path")
				.attr("class", "line")
				.datum(individualSummary["gpuUtilization"])
				.attr("d", curve)
				.attr("fill", theme.palette.gpuUtilization)
				.attr("transform", () => {
					return "translate(" + -1.5 * outerRadius + "," + 100 + ")";
				});

			const xScale2 = d3
				.scaleLinear()
				.range([0, -innerRadius / 2])
				.domain([0, 100]);
			const yScale2 = d3
				.scaleLinear()
				.range([-innerRadius, innerRadius])
				.domain([0, individualSummary["memUtilization"].length]);

			svgRef.current
				.append("path")
				.attr("class", "line")
				.datum(individualSummary["memUtilization"])
				.attr(
					"d",
					d3
						.line()
						.x((d) => xScale2(d))
						.y((d, i) => yScale2(i))
				)
				.attr("fill", theme.palette.cpuUtilization)
				.attr("transform", () => {
					return "translate(" + -1.5 * outerRadius + "," + 100 + ")";
				});
		}

		// Add y-axis ticks.
		if (withYAxis) {
			let yAxis = svgRef.current
				.append("g")
				.attr("text-anchor", "middle");

			const markerWidth = 10;
			const markerHeight = 10;

			const arrowPoints = [
				[0, 0],
				[0, markerWidth],
				[markerWidth, markerHeight / 2]
			];
			yAxis
				.append("defs")
				.append("marker")
				.attr("id", "legend-arrow")
				.attr("viewBox", [0, 0, markerWidth, markerHeight])
				.attr("refX", markerWidth / 2)
				.attr("refY", markerHeight / 2)
				.attr("markerWidth", markerWidth)
				.attr("markerHeight", markerHeight)
				.attr("orient", "auto-start-reverse")
				.append("path")
				.attr("d", d3.line()(arrowPoints))
				.attr("stroke", "black");

			yAxis
				.append("path")
				.attr(
					"d",
					d3.line()([
						[60, 80],
						[170, 80],
						[200, -10]
					])
				)
				.attr("stroke", "black")
				.attr("marker-end", "url(#legend-arrow)")
				.attr("fill", "none");

			let yTick = yAxis
				.selectAll("g")
				.data(y.ticks(4).slice(1))
				.enter()
				.append("g");

			yTick
				.append("circle")
				.attr("fill", "none")
				.attr("stroke", "#F6F4F9")
				.attr("stroke-width", 0.75)
				.attr("r", y);

			yTick
				.append("text")
				.attr("y", function (d) {
					return -y(d);
				})
				.attr("dy", "0.35em")
				.attr("fill", "#000")
				.style("font-size", style.fontSize)
				.text((d) => {
					return Math.ceil((d / maxY) * 100);
				})
				.attr(
					"transform",
					`translate(${outerRadius * 1.5},${innerRadius})`
				);
		}

		if (withPlayFeature) {
			windowArc.current = d3
				.arc()
				.innerRadius(innerRadius - 25)
				.outerRadius(innerRadius - 20);

			const startAngle = timestamp_to_tau(windowStart);
			const endAngle = timestamp_to_tau(windowEnd);

			playArcG.current = svgRef.current
				.append("path")
				.datum({ startAngle: startAngle, endAngle: endAngle })
				.style("fill", theme.text.label)
				.attr("d", (d) => {
					return windowArc.current(d);
				});

			const x_offset = -10;
			const y_offset = -10;
			svgRef.current
				.append("g")
				.attr("id", "play-button")
				.attr("class", "button")
				.attr("font-size", "18")
				.style("cursor", "pointer")
				.attr("fill", theme.text.label)
				.attr("transform", `translate(${x_offset},${y_offset})`)
				.on("click", () => {
					dispatch(updateAppState());
				})
				.append("path")
				.attr("d", play_pause_icon(appState));
		}
	}, [props]);

	function arcTween(speed) {
		return function (d) {
			// Reset the startAngle and endAngle to original angles once the
			// circle is complete.
			if (d.endAngle >= TAU) {
				return dispatch(updateAppState());
			}

			const new_startAngle = d.startAngle + speed * TAU;
			const new_endAngle = d.endAngle + speed * TAU;

			setCurrentSector(Math.ceil((new_startAngle / TAU) * 12) + 1);

			const interpolate_start = d3.interpolate(
				d.startAngle,
				new_startAngle
			);
			const interpolate_end = d3.interpolate(d.endAngle, new_endAngle);

			const start_ts = tau_to_timestamp(new_startAngle);
			const end_ts = tau_to_timestamp(new_endAngle);

			// Send the update to the timeline component.
			dispatch(updateWindow(start_ts, end_ts));

			// Send the update to renew the window objects.
			dispatch(fetchWindow(start_ts, end_ts));

			return function (t) {
				d.startAngle = interpolate_start(t);
				d.endAngle = interpolate_end(t);

				return windowArc.current(d);
			};
		};
	}

	function arcMoveTo(startAngle, endAngle) {
		return function (d) {
			const interpolate_start = d3.interpolate(d.startAngle, startAngle);
			const interpolate_end = d3.interpolate(d.endAngle, endAngle);

			return function (t) {
				d.startAngle = interpolate_start(t);
				d.endAngle = interpolate_end(t);

				return windowArc.current(d);
			};
		};
	}

	// Effect to control the play-pause feature.
	useEffect(() => {
		if (withPlayFeature) {
			d3.select("#play-button").selectAll("path").remove();

			d3.select("#play-button")
				.append("path")
				.attr("d", play_pause_icon(appState));

			if (appState) {
				const sectorCount = 12;
				const SPEED = 1 / sectorCount;
				const transition_callback = () => {
					playArcG.current
						.transition()
						.ease(d3.easeLinear)
						.duration(ANIMATION_DUR)
						.attrTween("d", arcTween(SPEED));
				};
				timer.current = d3.interval(transition_callback, ANIMATION_DUR);
			} else {
				if (timer.current != null) {
					// Stop the timer.
					timer.current.stop();

					// Simulate a fit-button click.
					d3.select("#fit-button").dispatch("click");

					// Highlight all the sectors since we are viewing the entire run.
					d3.selectAll(".sector").attr("opacity", 1);
				}
			}
		}
	}, [appState]);

	// Effect to control the timeline -> slider behavior.
	useEffect(() => {
		if (withPlayFeature) {
			const startAngle = timestamp_to_tau(windowStart);
			const endAngle = timestamp_to_tau(windowEnd);

			playArcG.current
				.transition()
				.duration(ANIMATION_DUR)
				.attrTween("d", arcMoveTo(startAngle, endAngle));

			if (!appState) {
				d3.selectAll(".sector").attr("opacity", 1);
			}
		}
	}, [windowEnd, windowStart]);

	// Effect to highlight the current sector.
	useEffect(() => {
		d3.selectAll(".sector").attr("opacity", 0.5);

		let _id = currentSector - 1;

		d3.selectAll("#sector-" + _id)
			.transition()
			.delay(function (d, i) {
				return 100 * i;
			})
			.duration(ANIMATION_DUR * 0.75)
			.attr("opacity", 1);
	}, [currentSector]);

	return <div id={containerName}></div>;
}
