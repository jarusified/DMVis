import { Grid, Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import ReorderIcon from "@mui/icons-material/Reorder";
import ToggleButton from "@mui/material/ToggleButton";
import Tooltip from "@mui/material/Tooltip";
import * as d3 from "d3";
import moment from "moment";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline";
import "vis-timeline/dist/vis-timeline-graph2d.css";

import { fetchTimeline, updateWindow } from "../actions";
import { micro_to_milli, milli_to_micro, msTimestampToSec, durToSec } from "../helpers/utils";

const useStyles = makeStyles((theme) => ({
	timeline: {
		width: window.innerWidth - 20
	}
}));

function TimelineWrapper() {
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
					const duration = moment.duration(
						date.diff(micro_to_milli(timelineStart))
					);
					switch (scale) {
						case "millisecond":
							return Math.ceil(duration.asMilliseconds()) + "ms";
						case "second":
							return Math.ceil(duration.asSeconds()) + "s";
						case "minute":
							return Math.ceil(duration.asMinutes()) + "min";
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

		txRef.current.on('click', (properties) => {
			switch (properties.what) {
				case 'group-label': {
					let group = _groups.get(properties.group)
					_options.stack = !_options.stack;
					_options.stackSubgroups = !_options.stackSubgroups;
					_options.cluster = !_options.cluster;

					txRef.current.setOptions(_options);

					if (group.content == "runtime" && group.showNested == false) {
						// const filteredItems = _events.get({
						// 	filter: (item) => {
						// 		return item.group == "snprof";
						// 	}
						// });

						// tx.itemSet.clusterGenerator.setItems(new DataSet(filteredItems));
						// tx.itemSet.clusterGenerator.updateData();
						// tx.redraw();
					}
					break
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

		txRef.current.on('rangechanged', (properties) => {
			if (properties.byUser == true) {
				if (properties.end - properties.start > summary.ts_width / 1e3) {
					dispatch(updateWindow(milli_to_micro(properties.start), milli_to_micro(properties.end)))
				}
			}
		});

		// Interactions: Fit the timeline to the screenWidth.
		document.getElementById("fit-button").onclick = function () {
			txRef.current.fit();
		};

		dispatch(updateWindow(timelineStart, timelineStart + 1e7));

	}, [currentTimeline]);

	useEffect(() => {
		if (txRef.current != undefined) {
			txRef.current.setWindow(micro_to_milli(windowStart), micro_to_milli(windowEnd));
		}
	}, [windowStart, windowEnd]);


	return (
		<Paper>
			<Typography
				variant="overline"
				style={{ fontWeight: "bold", marginRight: 1 }}
			>
				Timeline
			</Typography>
			<Grid container m={1}>
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
				<Grid item xs={6} container justifyContent="flex-end">
					<Typography variant="caption">
						Total time:{" "}
						{msTimestampToSec(timelineEnd, timelineStart)}s; Total
						events: {currentTimeline.events.length}
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
