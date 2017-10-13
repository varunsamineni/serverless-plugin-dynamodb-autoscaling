"use strict";

const test   = require("tape")
    , Plugin = require("../");

const roleResource              = require("./__snapshots__/role-resource")
    , tableNoIndexes            = require("./__snapshots__/table-no-indexes")
    , tableIndexes              = require("./__snapshots__/table-indexes")
    , resourcesNoIndexes        = require("./__snapshots__/resources-no-indexes-default")
    , resourcesIndexes          = require("./__snapshots__/resources-indexes-default")
    , resourcesIndexesNoIndexes = require("./__snapshots__/resources-indexes-no-indexes")
    , resourcesIndexesNoTable   = require("./__snapshots__/resources-indexes-no-table")
    , resourcesIndexesCustom    = require("./__snapshots__/resources-indexes-custom")
    , resourcesIndexesCustom2   = require("./__snapshots__/resources-indexes-custom-2");

test("Serverless Plugin Dynamodb Autoscaling", t => {
	const templateMock = {}, configMock = {};
	const serverlessMock = {
		service: { provider: { compiledCloudFormationTemplate: templateMock }, custom: configMock }
	};
	const resolver = new Plugin(serverlessMock).hooks[
		"after:aws:package:finalize:mergeCustomProviderResources"
	];

	templateMock.Resources = Object.assign({}, tableNoIndexes);
	resolver();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableNoIndexes, resourcesNoIndexes),
		"Automatically creates scaling resources for a table"
	);

	templateMock.Resources = Object.assign({}, tableIndexes);
	resolver();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexes),
		"Automatically creates scaling resources for a table with indexes"
	);

	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { "*": { indexes: false } };
	resolver();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexesNoIndexes),
		"Does not autoscale indexes with indexes: false"
	);

	templateMock.Resources = Object.assign({}, tableNoIndexes);
	configMock.dynamodbAutoscaling = { "*": { read: false, write: false } };
	resolver();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, tableNoIndexes),
		"Does not autoscale with read: false and write: false"
	);

	templateMock.Resources = Object.assign({ Foo: {} }, tableIndexes);
	configMock.dynamodbAutoscaling = { "*": false };
	resolver();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({ Foo: {} }, tableIndexes),
		"Does not autoscale with *: false"
	);

	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { "*": true };
	resolver();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexes),
		"Apply defaults on *: true setting"
	);

	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { "*": { minCapacity: 100 } };
	resolver();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexesCustom),
		"Apply global custom settings"
	);

	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = {
		"maas-tsp-dev-nextbike-customers": { table: { maxCapacity: 800 } },
		"elo": { minCapactity: 30 }
	};
	resolver();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexesCustom2),
		"Apply specific table custom settings"
	);

	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { "*": { indexes: true } };
	resolver();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexes),
		"Apply defaults on indexes: true setting"
	);

	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { "*": { indexes: { "*": true } } };
	resolver();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexes),
		"Apply defaults on indexes: { *: true } setting"
	);

	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { "*": { indexes: { read: true } } };
	resolver();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexes),
		"Apply defaults on indexes: { read: true } setting"
	);

	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { "*": { indexes: { marko: true } } };
	resolver();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexes),
		"Apply defaults on indexes: { indexName: true } setting"
	);

	templateMock.Resources = Object.assign({}, tableIndexes);
	configMock.dynamodbAutoscaling = { "*": { table: false } };
	resolver();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableIndexes, resourcesIndexesNoTable),
		"Does not autoscale table with table: false"
	);

	templateMock.Resources = Object.assign({}, tableNoIndexes);
	configMock.dynamodbAutoscaling = { miszka: { table: false } };
	resolver();
	t.deepEqual(
		templateMock.Resources,
		Object.assign({}, roleResource, tableNoIndexes, resourcesNoIndexes),
		"Does not apply not addressed patterns"
	);

	templateMock.Resources = {};
	configMock.dynamodbAutoscaling = 20;
	t.throws(
		() => resolver(),
		/Invalid 'dynamodbAutoscaling' configuration/,
		"Throws on invalid plugin configuration"
	);
	t.end();
});