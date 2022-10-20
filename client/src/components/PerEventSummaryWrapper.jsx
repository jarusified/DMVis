import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchEventSummary } from "../actions";
import D3BarGraph from "../ui/d3-bar-graph";

function PerEventSummaryWrapper() {
	const dispatch = useDispatch();

	const currentEventSummary = useSelector(
		(store) => store.currentEventSummary
	);
	const selectedExperiment = useSelector((store) => store.selectedExperiment);
	const timelineSummary = useSelector((store) => store.timelineSummary);
	const style = {
		top: 10,
		right: 40,
		bottom: 10,
		left: 20,
		width: window.innerWidth / 3 - 30,
		height: window.innerHeight / 3 - 50
	};
	const containerID = useRef("event-summary-view");

	useEffect(() => {
		if (selectedExperiment !== "") {
			let groups = timelineSummary.map((d) => d.group);
			dispatch(fetchEventSummary(groups));
		}
	}, [selectedExperiment]);

	useEffect(() => {
		if (
			currentEventSummary != undefined &&
			currentEventSummary.length > 0
		) {
			D3BarGraph(
				containerID.current,
				style,
				currentEventSummary,
				"event",
				"dur"
			);
		}
	}, [currentEventSummary]);
	return <div id={containerID.current}></div>;
}

export default PerEventSummaryWrapper;
