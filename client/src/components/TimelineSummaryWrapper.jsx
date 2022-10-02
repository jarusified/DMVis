import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchEventSummary } from "../actions";
import D3BarGraph from "../ui/d3-bar-graph";

function TimelineSummaryWrapper() {
	const dispatch = useDispatch();

	const currentEventSummary = useSelector(
		(store) => store.currentEventSummary
	);
	const selectedExperiment = useSelector((store) => store.selectedExperiment);

	const style = {
		top: 10,
		right: 20,
		bottom: 10,
		left: 20,
		width: window.innerWidth / 2,
		height: window.innerHeight / 4
	};
	const containerID = useRef("timeline-summary-view");

	useEffect(() => {
		if (selectedExperiment !== "") {
			dispatch(fetchEventSummary());
		}
	}, [selectedExperiment]);

	useEffect(() => {
		if (
			currentEventSummary != undefined &&
			currentEventSummary.length > 0
		) {
			D3BarGraph(containerID.current, style, currentEventSummary, "event", "dur");
		}
	}, [currentEventSummary]);
	return <div id={containerID.current}></div>;
}

export default TimelineSummaryWrapper;
