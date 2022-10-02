import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchTimelineSummary } from "../actions";
import D3BarGraph from "../ui/d3-bar-graph";

function PerTimelineSummaryWrapper() {
	const dispatch = useDispatch();

	const currentTimelineSummary = useSelector(
		(store) => store.currentTimelineSummary
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
			dispatch(fetchTimelineSummary());
		}
	}, [selectedExperiment]);

	useEffect(() => {
		if (
			currentTimelineSummary != undefined &&
			currentTimelineSummary.length > 0
		) {
			D3BarGraph(
				containerID.current,
				style,
				currentTimelineSummary,
				"event",
				"dur"
			);
		}
	}, [currentTimelineSummary]);
	return <div id={containerID.current}></div>;
}

export default PerTimelineSummaryWrapper;
