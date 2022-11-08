import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

// import { fetchHostDeviceComm } from "../actions";
import D3ChordDiagram from "../ui/d3-chord-diagram";

export default function HostDeviceCommunication() {
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
	const containerID = useRef("host-device-view");

	// useEffect(() => {
	// 	if (selectedExperiment !== "") {
	// 		let groups = timelineSummary.map((d) => d.group);
	// 		dispatch(fetchEventSummary(groups));
	// 	}
	// }, [selectedExperiment]);

	useEffect(() => {
			// D3ChordDiagram(
			// 	containerID.current,
			// 	style
			// )
	});
	return <div id={containerID.current}></div>;
}
