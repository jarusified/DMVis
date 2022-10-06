import { useTheme } from "@emotion/react";
import { makeStyles } from "@mui/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import ReorderIcon from "@mui/icons-material/Reorder";
import Grid from "@mui/material/Grid";
import Item from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import ToggleButton from "@mui/material/ToggleButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
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
		width: window.innerWidth - 10,
		left: 5
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
				},
			},
			groupOrder: function (a, b) {
				return a.value - b.value;
			},
			margin: {
				item: 5,
				axis: 10,
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
					// _options.stack = !_options.stack;
					// _options.stackSubgroups = !_options.stackSubgroups;
					// https://github.sambanovasystems.com/surajk/NOVA-VIS/issues/28
					// _options.cluster = !_options.cluster;

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
			// if (properties.byUser == true) {
			// 	if (properties.end - properties.start > summary.ts_width / 1e3) {
			// 		dispatch(updateWindow(milli_to_micro(properties.start), milli_to_micro(properties.end)))
			// 	}
			// }
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
			<Typography variant="overline" style={{ margin: 10, fontWeight: "bold", fontSize: theme.text.fontSize }}>
				Timeline
			</Typography>
			<Grid container>
				{/*<Grid item id="left-button">
					<ToggleButton variant="contained" value="check" size="small" className={classes.button}>
						<Tooltip title="Previous" arrow>
							<ChevronLeftIcon className="icon" />
						</Tooltip>
					</ToggleButton>
				</Grid>
				<Grid item id="right-button">
					<ToggleButton size="small" value="check" className={classes.button}>
						<Tooltip title="Next" arrow>
							<ChevronRightIcon className="icon" />
						</Tooltip>
					</ToggleButton>
				</Grid>*/}
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
				</Grid>
				<Grid item xs={6} justifyContent="flex-end">
					<Typography variant="caption" style={{ fontSize: theme.text.fontSize }}>
						Total time: {" "}
						<span style={{ color: "#00adb5" }}>
							{formatDuration(timelineEnd, timelineStart)}
						</span>
					</Typography>
					<Typography>{"     "}</Typography>
					<Typography variant="caption" style={{ fontSize: theme.text.fontSize }}>
						Total events: {"  "}
						<span style={{ color: "#00adb5" }}>
							{currentTimeline.events.length}
						</span>
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
