import { useTheme } from "@emotion/react";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import ToggleButton from "@mui/material/ToggleButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import * as d3 from "d3";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline";
import "vis-timeline/dist/vis-timeline-graph2d.css";

import { fetchTimeline, fetchWindow, updateWindow } from "../actions";
import { formatDuration, micro_to_milli } from "../helpers/utils";

const useStyles = makeStyles((theme) => ({
	timeline: {
		width: window.innerWidth * 0.66 - 10
	}
}));

function TimelineWrapper() {
	const theme = useTheme();
	const classes = useStyles();
	const dispatch = useDispatch();

	const currentTimeline = useSelector((store) => store.currentTimeline);
	const selectedExperiment = useSelector((store) => store.selectedExperiment);
	const timelineEnd = useSelector((store) => store.timelineEnd);
	const timelineStart = useSelector((store) => store.timelineStart);
	const windowEnd = useSelector((store) => store.windowEnd);
	const windowStart = useSelector((store) => store.windowStart);
	const summary = useSelector((store) => store.summary);

	const txRef = useRef(undefined);
	const [autoPlay, setAutoPlay] = useState(false);

	useEffect(() => {
		if (
			selectedExperiment !== "" &&
			timelineStart != 0 &&
			timelineEnd != 0
		) {
			dispatch(fetchTimeline(timelineStart, timelineStart));
		}
	}, [selectedExperiment, timelineStart, timelineEnd]);

	useEffect(() => {
		d3.select("#timeline-view").selectAll("*").remove();
		let container = document.getElementById("timeline-view");

		let { end_ts, events, groups, start_ts } = currentTimeline;

		events = events.map((e) => {
			e["start"] = micro_to_milli(e["start"]);
			e["end"] = micro_to_milli(e["end"]);

			return e;
		});

		let _groups = new DataSet(groups);
		let _events = new DataSet(events);

		// Configuration for the Timeline
		const _options = {
			autoResize: true,
			format: {
				minorLabels: function (date, scale, step) {
					switch (scale) {
						case "millisecond":
							return formatDuration(date, timelineStart);
						case "second":
							return formatDuration(date, timelineStart);
						case "minute":
							return formatDuration(date, timelineStart);
					}
				}
			},
			groupOrder: function (a, b) {
				return a.value - b.value;
			},
			margin: {
				item: 5,
				axis: 10
			},
			max: Math.ceil(micro_to_milli(timelineEnd)),
			min: Math.ceil(micro_to_milli(timelineStart)),
			moment: function (date) {
				return moment(date);
			},
			orientation: "top",
			preferZoom: true,
			showMajorLabels: false,
			showMinorLabels: true,
			stack: false,
			stackSubgroups: false,
			tooltip: {
				followMouse: true,
				template: function (item, element, data) {
					return item.title + " : " + item.dur;
				}
			}
		};

		// Create a Timeline
		txRef.current = new Timeline(container);

		txRef.current.setItems(_events);
		txRef.current.setGroups(_groups);
		txRef.current.setOptions(_options);

		txRef.current.on("click", (properties) => {
			switch (properties.what) {
				case "group-label": {
					let group = _groups.get(properties.group);
					_options.stack = !_options.stack;
					// _options.stackSubgroups = !_options.stackSubgroups;
					_options.cluster = !_options.cluster;

					txRef.current.setOptions(_options);

					if (
						group.content == "runtime" &&
						group.showNested == false
					) {
						// const filteredItems = _events.get({
						// 	filter: (item) => {
						// 		return item.group == "snprof";
						// 	}
						// });
						// tx.itemSet.clusterGenerator.setItems(new DataSet(filteredItems));
						// tx.itemSet.clusterGenerator.updateData();
						// tx.redraw();
					}
					break;
				}
				case "axis":
					break;
				case "background":
					break;
				case "current-time":
					break;
				case "item":
					break;
			}
		});

		txRef.current.on("rangechanged", (properties) => {
			if (properties.byUser == true) {
				if (
					properties.end - properties.start >
					summary.ts_width / 1e3
				) {
					// Calculate the timestamps from vis-timeline.
					// Date.parse converts the "Tue Dec 03 54735 23:38:27
					// GMT-0800 (Pacific Standard Time)" to "1665131672307000".
					const start_ts = Date.parse(properties.start);
					const end_ts = Date.parse(properties.end);

					console.debug(
						"[Timeline] Update the window: ",
						start_ts,
						" to",
						end_ts
					);
					dispatch(updateWindow(start_ts, end_ts));

					console.log(
						"[Timeline] Fetching data for window: ",
						start_ts,
						"-",
						end_ts
					);
					dispatch(fetchWindow(start_ts, end_ts));
				}
			}
		});

		// Interaction: Fit the timeline to the screenWidth.
		document.getElementById("fit-button").onclick = function () {
			txRef.current.fit();
		};

		// Enable brushing only if the timeline is more than 100 seconds.
		const timelineWidth = timelineEnd - timelineStart;
		const sectorCount = 12;
		const sectorWidth = timelineWidth / sectorCount;

		if (timelineWidth != 0) {
			console.log(sectorCount, sectorWidth, timelineStart);
			// Update the window in the global scope.
			dispatch(updateWindow(timelineStart, timelineStart + sectorWidth));

			// Fetch the new results for the current window.
			console.log(
				"Fetching data for window: ",
				timelineStart,
				"-",
				timelineStart + sectorWidth
			);
			dispatch(fetchWindow(timelineStart, timelineStart + sectorWidth));
		}
	}, [currentTimeline]);

	function move() {
		let speed = 0.1;
		let range = txRef.current.getWindow();
		const interval = range.end - range.start;
		txRef.current.setWindow({
			start: range.start.valueOf() + interval * speed,
			end: range.end.valueOf() + interval * speed
		});
	}

	useEffect(() => {
		if (txRef.current != undefined) {
			d3.timeout(() => {
				txRef.current.setWindow(
					micro_to_milli(windowStart),
					micro_to_milli(windowEnd)
				);
			}, 500);
		}
	}, [windowStart, windowEnd]);

	return (
		<Paper>
			<Grid container p={1}>
				<Grid item xs={4}>
					<Typography
						variant="overline"
						style={{
							margin: 10,
							fontWeight: "bold",
							fontSize: theme.text.fontSize
						}}
					>
						Event Timeline {"  "}
						<span style={{ color: theme.text.label }}>
							({currentTimeline.events.length} events)
						</span>
					</Typography>
				</Grid>
				<Grid item xs={4}></Grid>
				<Grid item xs={4}>
					<Tooltip title="Fit" arrow>
						<ToggleButton
							id="fit-button"
							size="small"
							value="check"
							className={classes.button}
						>
							<Typography
								variant="bold"
								align="center"
								style={{ color: theme.text.label }}
							>
								Fit
							</Typography>
							<FullscreenIcon className="icon" />
						</ToggleButton>
					</Tooltip>
				</Grid>
				<Grid item>
					<div id="timeline-view" className={classes.timeline}></div>
				</Grid>
			</Grid>
		</Paper>
	);
}

export default TimelineWrapper;
