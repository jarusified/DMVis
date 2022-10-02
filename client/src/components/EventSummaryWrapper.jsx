import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchEventSummary } from "../actions";
import D3BarGraph from "../ui/d3-bar-graph";

function EventSummaryWrapper() {
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
	const containerHeight = window.innerHeight / 4;
	const containerID = "#event-summary-view";

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
			console.log(currentEventSummary);
			D3BarGraph(containerID, style, currentEventSummary, "event", "dur");
		}
	}, [currentEventSummary]);
	return <div id="event-summary-view"></div>;
}

export default EventSummaryWrapper;
