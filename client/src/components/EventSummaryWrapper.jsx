import React, { useEffect } from "react";
import * as d3 from "d3";
import { useDispatch, useSelector } from "react-redux";

import { makeStyles } from "@material-ui/core/styles";

import { fetchEventSummary } from "../actions";
import { durToSec, COLORS } from "../helpers/utils";

const useStyles = makeStyles((theme) => ({
    eventSummary: {
        width: window.innerWidth / 2 - 20,
    },
}));

function EventSummaryWrapper() {
    const classes = useStyles();
    const dispatch = useDispatch();

    const eventSummary = useSelector((store) => store.eventSummary);
    const selectedExperiment = useSelector((store) => store.selectedExperiment);

    const margin = { top: 10, right: 20, bottom: 10, left: 30 };
    const containerWidth = window.innerWidth / 2;
    const containerHeight = window.innerHeight / 5;
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.bottom - margin.top;

    useEffect(() => {
        if (selectedExperiment !== "") {
            dispatch(fetchEventSummary());
        }
    }, [selectedExperiment]);


    useEffect(() => {
        d3.select("#event-summary-view").selectAll("*").remove();
        if (eventSummary != undefined && eventSummary.length > 0) {
            const events = eventSummary.map((bar) => bar.event);
            const durations = eventSummary.map((bar) => bar.dur)

            let x = d3.scaleBand().domain(events).range([0, width]).padding(0.2);
            let y = d3.scaleLinear().domain(d3.extent(durations)).range([height, 0]);

            let xAxis = d3.axisBottom()
                .scale(x)
                .ticks(10)
                .tickPadding(-x.bandwidth() / 2 + 2)
                .tickSizeOuter(2)
                .tickFormat((d) => d);

            let yAxis = d3.axisLeft()
                .scale(y)
                .ticks(3)
                .tickFormat((d) => durToSec(d) + 's');

            let svg = d3.select("#event-summary-view").append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + -margin.bottom + ")")

            svg.selectAll("bars")
                .data(eventSummary)
                .enter()
                .append("rect")
                .attr("x", (d) => { return x(d.event); })
                .attr("y", (d) => { return y(d.dur); })
                .attr("width", x.bandwidth())
                .attr("height", (d) => { return height - y(d.dur); })
                .attr("fill", (d) => { return COLORS[d.group] })

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + y(0) + ")")
                .call(xAxis)
                .selectAll("text")
                .attr("dy", "1em")
                .style("text-anchor", "end")
                .attr("transform", "rotate(90)");

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0)
                .attr("dy", "1em")
                .style("text-anchor", "end")
                .text("time (s))");
        }
    }, [eventSummary]);
    return (
        <div id="event-summary-view" className={classes.timeline}></div>
    );
}

export default EventSummaryWrapper;
