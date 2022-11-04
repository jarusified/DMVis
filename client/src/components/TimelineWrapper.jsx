import { useTheme } from "@emotion/react";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import Grid from "@mui/material/Grid";
import Item from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import ToggleButton from "@mui/material/ToggleButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { makeStyles } from "@mui/styles";
import * as d3 from "d3";
import moment from "moment";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline";
import "vis-timeline/dist/vis-timeline-graph2d.css";

import { fetchTimeline, updateWindow } from "../actions";
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
			// zoomMin: 10,
			// zoomMax: 100000,
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
					return item.content + " : " + item.dur;
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
					// https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/29
					_options.stack = !_options.stack;
					// _options.stackSubgroups = !_options.stackSubgroups;
					// https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/28
					_options.cluster = !_options.cluster;

					txRef.current.setOptions(_options);

					if (
						group.content == "runtime" &&
						group.showNested == false
					) {
						// https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/29
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
			// TODO: This below code updates the summaryTimeline with the ranges provided by the upper timeline.
			// But this forces the control too much and cause very glitchy motion to restrict the ranges.
			// For now, this is commented out.
			// https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/21
			if (properties.byUser == true) {
				if (
					properties.end - properties.start >
					summary.ts_width / 1e3
				) {
					dispatch(
						updateWindow(
							Date.parse(properties.start),
							Date.parse(properties.end)
						)
					);
				}
			}
		});

		// Interactions: Fit the timeline to the screenWidth.
		document.getElementById("fit-button").onclick = function () {
			txRef.current.fit();
		};

		// Enable brushing only if the timeline is more than 100 seconds.
		if (timelineEnd - timelineStart > 1e8) {
			dispatch(updateWindow(timelineStart, timelineStart + 1e7));
		}
	}, [currentTimeline]);

	useEffect(() => {
		if (txRef.current != undefined) {
			txRef.current.setWindow(
				micro_to_milli(windowStart),
				micro_to_milli(windowEnd)
			);
		}
	}, [windowStart, windowEnd]);

	return (
		<Paper>
			<Grid item xs={4} p={1}>
				<Typography
					variant="overline"
					style={{
						margin: 10,
						fontWeight: "bold",
						fontSize: theme.text.fontSize
					}}
				>
					Timeline
				</Typography>
			</Grid>
			<Grid container>
				<Grid item id="fit-button" xs={6}>
					<Tooltip title="Fit" arrow>
						<ToggleButton
							size="small"
							value="check"
							className={classes.button}
						>
							<FullscreenIcon className="icon" />
						</ToggleButton>
					</Tooltip>
					<Tooltip title="Play" arrow>
						<ToggleButton
							size="small"
							value="check"
							className={classes.button}
						>
							<PlayArrowIcon className="icon" />
						</ToggleButton>
					</Tooltip>
					<Tooltip title="Pause" arrow>
						<ToggleButton
							size="small"
							value="check"
							className={classes.button}
						>
							<PauseIcon className="icon" />
						</ToggleButton>
					</Tooltip>
					<Tooltip title="Stop" arrow>
						<ToggleButton
							size="small"
							value="check"
							className={classes.button}
						>
							<StopIcon className="icon" />
						</ToggleButton>
					</Tooltip>
					<Typography
						variant="caption"
						style={{
							margin: 20,
							fontSize: theme.text.fontSize
						}}
					>
						Events: {"  "}
						<span style={{ color: "#00adb5" }}>
							{currentTimeline.events.length}
						</span>
					</Typography>
					<Typography
						variant="caption"
						style={{
							margin: 20,
							fontSize: theme.text.fontSize
						}}
					>
						Groups: {"4"}
					</Typography>
				</Grid>
			</Grid>
			<Grid container>
				<Grid item>
					<div id="timeline-view" className={classes.timeline}></div>
				</Grid>
			</Grid>
		</Paper>
	);
}

export default TimelineWrapper;
