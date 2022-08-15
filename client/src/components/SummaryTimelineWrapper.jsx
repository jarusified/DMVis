import React, { useEffect, useState } from "react";
import * as d3 from "d3";
import { useDispatch, useSelector } from "react-redux";

import { Grid, Paper, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import { fetchSummary } from "../actions";

const useStyles = makeStyles((theme) => ({
    summary: {
        width: window.innerWidth - 20,
    }
}));

function SummaryTimelineWrapper() {
    const classes = useStyles();
    const dispatch = useDispatch();

    const selectedExperiment = useSelector((store) => store.selectedExperiment);
    const summary = useSelector((store) => store.summary);

    useEffect(() => {
        if (selectedExperiment !== "") {
            dispatch(fetchSummary(selectedExperiment));
        }
    }, [selectedExperiment]);

    const margin = { top: 0, right: 0, bottom: 10, left: 40 };
    const width = window.innerWidth - margin.left - margin.right;
    const height = 150 - margin.top - margin.bottom;
    // TODO: Move this to a common .css
    const colors = {
        "compile": "#8dd3c7",
        "runtime": "#bebada",
        "tracing": "#ffffb3"
    }

    useEffect(() => {
        d3.select("#summary-view").selectAll("*").remove();

        const bars = summary.data;
        const min = summary.min;
        const max = summary.max;
        if (bars.length > 0) {
            let x = d3.scaleLinear().domain([0, bars.length]).range([0, width]);
            let y = d3.scaleLinear().domain([0, max]).range([height, 0]);

            let xAxis = d3.axisBottom()
                .scale(x)
                .ticks(10)
                .tickFormat((d) => {
                    if (d == 0) { return ""};
                    if (bars.length < 1000) {
                        return d;
                    }
                    else {
                        return d/1000.0 + "k";
                    }
                })

            let yAxis = d3.axisLeft()
                .scale(y)
                .ticks(10)
                .tickFormat((d) => {
                    if(d == 0) { return ""; }
                    return d/1000000.0 + "s";
                })

            let svg = d3.select("#summary-view").append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + 0 + ")")
                .call(xAxis)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", "-0.5em")
                .attr("transform", "rotate(-90)");

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis)
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text("Value ($)");

            let barWidth = 5;

            svg.selectAll("bar")
                .data(bars)
                .enter().append("rect")
                .style("fill", (d) => colors[d["name"]])
                .attr("x", function (d, i) { return x(i); })
                .attr("width", barWidth)
                .attr("y", function (d) {return y(d["duration"]); })
                .attr("height", function (d) { return height - y(d["duration"]); });
        }
    }, [summary]);
    return (
        <Paper>
            <Typography variant="overline" style={{ fontWeight: "bold" }}>
                Summary
            </Typography>
            <Grid container>
                <Grid item>
                    <div id="summary-view"></div>
                </Grid>
            </Grid>
        </Paper>
    );
}

export default SummaryTimelineWrapper;
